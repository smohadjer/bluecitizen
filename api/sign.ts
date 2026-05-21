import dotenv from 'dotenv';
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
};

function value(data: SignCompassSubmission, key: keyof SignCompassSubmission) {
	return String(data[key] || '').trim();
}

function formatCheckbox(value: string) {
	return value ? 'Yes' : 'No';
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
	const missingFields = validate(data);

	if (missingFields.length) {
		return res.status(400).send(`Missing required fields: ${missingFields.join(', ')}`);
	}

	const firstName = value(data, 'first-name');
	const lastName = value(data, 'last-name');
	const country = value(data, 'country');
	const email = value(data, 'email');
	const affiliation = value(data, 'affiliation') || 'Not provided';
	const supportCompass = formatCheckbox(value(data, 'support-compass'));
	const publicDisplayConsent = formatCheckbox(value(data, 'public-display-consent'));

	const message = [
		'New Blue Citizen Compass signature submission',
		'',
		`First Name: ${firstName}`,
		`Last Name: ${lastName}`,
		`Country: ${country}`,
		`Email: ${email}`,
		`Affiliation: ${affiliation}`,
		`Supports Compass: ${supportCompass}`,
		`Public display consent: ${publicDisplayConsent}`
	].join('\n');

	try {
		await getTransport().sendMail({
			from: process.env.email_from || process.env.email_username,
			replyTo: email,
			to: process.env.email_to,
			subject: `Blue Citizen Compass signature: ${firstName} ${lastName}`,
			text: message
		});

		return res.status(200).send('Thank you for signing the Blue Citizen Compass.');
	} catch (error) {
		console.error('Failed to send sign compass email:', error);
		return res.status(500).send('Could not send your signature at this time. Please try again later.');
	}
}
