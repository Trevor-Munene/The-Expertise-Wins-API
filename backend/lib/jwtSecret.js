const MIN_SECRET_LENGTH = 32;

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (!secret || secret.length < MIN_SECRET_LENGTH) {
    throw new Error(`JWT_SECRET must be configured with at least ${MIN_SECRET_LENGTH} characters.`);
  }

  return secret;
}

module.exports = { getJwtSecret, MIN_SECRET_LENGTH };
