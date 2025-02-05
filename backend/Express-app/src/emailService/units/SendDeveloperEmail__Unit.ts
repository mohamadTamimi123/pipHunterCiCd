import {transport} from "../email";

const sender = {
    address: "hello@example.com",
    name: "Mailtrap Test",
};
const recipients = [
    "mtamimipoor@gmail.com",
];



export function SendDeveloperEmail__Unit(val:any){

    transport
        .sendMail({
            from: sender,
            to: recipients,
            subject: "You are awesome!",
            text: val,
            category: "Integration Test",
            sandbox: true
        })
        .then(console.log, console.error);



}