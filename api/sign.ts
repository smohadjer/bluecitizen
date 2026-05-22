import dotenv from 'dotenv';
import { Collection, MongoClient } from 'mongodb';
import nodemailer from 'nodemailer';

dotenv.config({ path: '.env', quiet: true });

type SignCompassSubmission = {
	'affiliation'?: string;
	'country'?: string;
	'email'?: string;
	'first-name'?: string;
	'last-name'?: string;
	'public-display-consent'?: string;
	'support-compass'?: string;
	'website'?: string;
};

type CompassSignatureDocument = {
	affiliation?: string;
	country: string;
	countryCode: string;
	createdAt: Date;
	email: string;
	emailNormalized: string;
	firstName: string;
	lastName: string;
	publicDisplayConsent: boolean;
	source: string;
	supportCompass: boolean;
};

const countryNames = new Intl.DisplayNames(['en'], { type: 'region' });

declare global {
	var mongoClientPromise: Promise<MongoClient> | undefined;
}

function value(data: SignCompassSubmission, key: keyof SignCompassSubmission) {
	return String(data[key] || '').trim();
}

function formatCheckbox(value: string) {
	return value ? 'Yes' : 'No';
}

function getBoolean(value: string) {
	return Boolean(value);
}

function getCountryName(countryCode: string) {
	try {
		return countryNames.of(countryCode) || countryCode;
	} catch {
		return countryCode;
	}
}

function getMongoClient() {
	const uri = process.env.db_uri;

	if (!uri) {
		throw new Error('Missing MongoDB configuration: db_uri');
	}

	if (!globalThis.mongoClientPromise) {
		const client = new MongoClient(uri);
		globalThis.mongoClientPromise = client.connect();
	}

	return globalThis.mongoClientPromise;
}

async function saveCompassSignature(document: CompassSignatureDocument) {
	const collection = await getCompassCollection();
	await collection.insertOne(document);
}

async function getCompassCollection(): Promise<Collection<CompassSignatureDocument>> {
	const databaseName = process.env.db_name;

	if (!databaseName) {
		throw new Error('Missing MongoDB configuration: db_name');
	}

	const client = await getMongoClient();
	return client.db(databaseName).collection<CompassSignatureDocument>('compass');
}

async function hasExistingSignature(emailNormalized: string) {
	const collection = await getCompassCollection();
	const existingSignature = await collection.findOne({
		$or: [
			{ emailNormalized },
			{ email: emailNormalized }
		]
	}, {
		collation: {
			locale: 'en',
			strength: 2
		}
	});

	return Boolean(existingSignature);
}

function getTransport() {
	const user = process.env.email_username;
	const pass = process.env.email_password;
	const missingEnvironment = [
		['email_username', user],
		['email_password', pass]
	].filter(([, value]) => !value).map(([name]) => name);

	if (missingEnvironment.length) {
		throw new Error(`Missing email configuration: ${missingEnvironment.join(', ')}`);
	}

	return nodemailer.createTransport({
		service: 'gmail',
		auth: {
			user,
			pass
		}
	});
}

function validate(data: SignCompassSubmission) {
	const requiredFields: Array<keyof SignCompassSubmission> = [
		'first-name',
		'last-name',
		'country',
		'email',
		'support-compass',
		'public-display-consent'
	];

	return requiredFields.filter((field) => !value(data, field));
}

export default async function handler(req, res) {
	if (req.method !== 'POST') {
		res.setHeader('Allow', 'POST');
		return res.status(405).send('Method Not Allowed');
	}

	const data = req.body as SignCompassSubmission;

	if (value(data, 'website')) {
		return res.status(200).send('Thank you for signing the Blue Citizen Compass.');
	}

	const missingFields = validate(data);

	if (missingFields.length) {
		return res.status(400).send(`Missing required fields: ${missingFields.join(', ')}`);
	}

	const countryCode = value(data, 'country').toUpperCase();

	if (!/^[A-Z]{2}$/.test(countryCode)) {
		return res.status(400).send('Invalid country.');
	}

	const firstName = value(data, 'first-name');
	const lastName = value(data, 'last-name');
	const country = getCountryName(countryCode);
	const email = value(data, 'email');
	const emailNormalized = email.toLowerCase();
	const affiliation = value(data, 'affiliation');
	const supportCompassValue = value(data, 'support-compass');
	const publicDisplayConsentValue = value(data, 'public-display-consent');
	const supportCompass = getBoolean(supportCompassValue);
	const publicDisplayConsent = getBoolean(publicDisplayConsentValue);
	const compassSignature: CompassSignatureDocument = {
		firstName,
		lastName,
		country,
		countryCode,
		email,
		emailNormalized,
		...(affiliation ? { affiliation } : {}),
		supportCompass,
		publicDisplayConsent,
		source: 'sign_compass',
		createdAt: new Date()
	};

	const message = [
		'New Blue Citizen Compass signature submission',
		'',
		`First Name: ${firstName}`,
		`Last Name: ${lastName}`,
		`Country: ${country}`,
		`Email: ${email}`,
		`Affiliation: ${affiliation || 'Not provided'}`,
		`Supports Compass: ${formatCheckbox(supportCompassValue)}`,
		`Public display consent: ${formatCheckbox(publicDisplayConsentValue)}`
	].join('\n');

	try {
		if (await hasExistingSignature(emailNormalized)) {
			return res.status(409).send('This email has already signed the compass.');
		}

		await saveCompassSignature(compassSignature);

		await getTransport().sendMail({
			from: process.env.email_from || process.env.email_username,
			replyTo: email,
			to: process.env.email_to,
			subject: `Blue Citizen Compass signature: ${firstName} ${lastName}`,
			text: message
		});

		return res.status(200).send('Thank you for signing the Blue Citizen Compass.');
	} catch (error) {
		console.error('Failed to process sign compass submission:', error);
		return res.status(500).send('Could not submit your signature at this time. Please try again later.');
	}
}
