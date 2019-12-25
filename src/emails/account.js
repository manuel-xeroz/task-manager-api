const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const sendWelcomeMail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'xeroztechsystems@team.com',
        subject: 'Welcome to our team',
        text: `Thank you for joining us ${name}, I hope to hear from you`,
    })
}

const sendCancellationMail = (email, name) => {
    sgMail.send({
        to: email,
        from: 'xeroztechsystems@team.com',
        subject: 'We will miss you',
        text: `Please tell us the reason why you deleted your account ${name}. we hope to get your feedback`,
    })
}

module.exports = {
    sendWelcomeMail,
    sendCancellationMail
}