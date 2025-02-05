const Nodemailer = require("nodemailer");
const { MailtrapTransport } = require("mailtrap");

const TOKEN = "ef3c7612a4d4e6252a1c5b816c4cf6fc";

export const transport = Nodemailer.createTransport(
    MailtrapTransport({
        token: TOKEN,
        testInboxId: 2797664,
    })
);

const sender = {
    address: "hello@example.com",
    name: "Mailtrap Test",
};
const recipients = [
    "mtamimipoor@gmail.com",
];

export default function sendmail(){

    transport
        .sendMail({
            from: sender,
            to: recipients,
            subject: "You are awesome!",
            text: "Congrats for sending test email with Mailtrap!",
            category: "Integration Test",
            sandbox: true
        })
        .then(console.log, console.error);



}
