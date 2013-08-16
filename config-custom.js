module.exports = {
	DB_URI: process.env.DB_URI,
	BASE_URL: process.env.BASE_URL,
	SERVER_HOST: process.env.HOST || '0.0.0.0',
	SERVER_PORT: process.env.PORT || 3000,
	SMTP_HOST: process.env.SMTP_HOST,
	SMTP_PORT: process.env.SMTP_PORT,
	SMTP_USERNAME: process.env.SMTP_USERNAME,			
	SMTP_PASSWORD: process.env.SMTP_PASSWORD,
	DEFAULT_HOSTS: process.env.DEFAULT_HOSTS ?
		process.env.DEFAULT_HOSTS.split(',') : null
};
