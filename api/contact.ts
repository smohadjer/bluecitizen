export default function handler(req, res) {
  /*
  if (req.body) {
    return res.send(`Hello ${req.body.username}!`);
  } else {
    return res.send(`Hello ${req.query.username}!`);
  }
  */
  console.log('form handler invoked');

  if (req.body) {
    res.setHeader('Content-Type', 'text/plain')
    res.write('you posted:\n')
    res.end(JSON.stringify(req.body, null, 2))
  }
}
