import got from 'got';
const twillioAccountSid = process.env.TWILLIO_ACCOUNT_SSID
const twillioAuthToken = process.env.TWILLIO_AUTH_TOKEN
const twillioWhatsappReciver = process.env.WHATSAPP_RECIVER
const twilioUrl = process.env.TWILLIO_URL
const twillioSender = process.env.TWILLIO_SENDER
// export const formatDate = (date) => {
//     return new Date(date).toLocaleDateString('en-GB', {
//         day: '2-digit',
//         month: '2-digit',
//         year: 'numeric',
//     });
// };
let accountSid = process.env.TWILLIO_ACCOUNT_SSID
let authToken = process.env.TWILLIO_AUTH_TOKEN
export const formatDate = (date) => {
    if (!date) return '';  // Return an empty string if the date is null or undefined
    const d = new Date(date);
    let month = '' + (d.getMonth() + 1);
    let day = '' + d.getDate();
    const year = d.getFullYear();

    if (month.length < 2) month = '0' + month;
    if (day.length < 2) day = '0' + day;

    return [day, month, year].join('/');
};


export const sendWhatsAppMessage =  async (body) => {
    const params = new URLSearchParams();
    params.append('To', twillioWhatsappReciver);
    params.append('From', twillioSender);
    params.append('Body', body);  
    try {
        const response = await got.post(twilioUrl, {
            headers: {
                'Authorization': 'Basic ' + Buffer.from(`${twillioAccountSid}:${twillioAuthToken}`).toString('base64'),
                'Content-Type': 'application/x-www-form-urlencoded'
            },
            body: params.toString(),
            responseType: 'json'
        });
    
        console.log('Message sent:', response.body);
    } catch (error) {
        console.error('Error sending message:', error.response ? error.response.body : error.message);
    }
}

