import * as soapSchema from './PSSOAP/schemaParser.js';
const rootUrl = 'https://md-api.bqbo.workers.dev/pearson-rest/services/PublicPortalService';
const rootUrlJSON = 'https://md-api.bqbo.workers.dev/pearson-rest/services/PublicPortalService?response=application/json';
const userAgent = 'PowerSchool/1793340069 CFNetwork/3896.200.52 Darwin/27.2.0';
const inputs = document.querySelectorAll('.tvInput');
const serializer = new XMLSerializer();

inputs.forEach((input, index) => {
    input.addEventListener('input', () => {
        if (!/^\d*$/.test(input.value)) {
            input.value = input.value.replace(/\D/g, '');
        }

        if (input.value.length > 1) {
            const digits = input.value.split('');

            digits.forEach((digit, i) => {
                const target = inputs[index + i];

                if (target) {
                    target.value = digit;
                }
            });

            const nextIndex = Math.min(
                index + digits.length,
                inputs.length - 1
            );

            inputs[nextIndex].focus();
            return;
        }

        if (input.value.length === 1) {
            const nextInput = inputs[index + 1];

            if (nextInput) {
                nextInput.focus();
            }
        }
    });

    input.addEventListener('keydown', (e) => {
        if (e.key === 'Backspace' && input.value === '') {
            const prevInput = inputs[index - 1];

            if (prevInput) {
                prevInput.focus();
            }
        }
    });
});

function sendError(title, description, buttonText, buttonAction) {
    document.querySelector('.fill-notif').style.display = 'block';
    document.querySelector('.fn-in .sh1').innerText = title;
    document.querySelector('.fn-in .sp').innerText = description;
    document.querySelector('.fn-in .tvButton').innerText = buttonText;
    document.querySelector('.fn-in .tvButton').addEventListener('mouseup', () => {
        buttonAction();
    });
}

function formatLocalDateTime(date = new Date()) {
    const pad = (num) => String(num).padStart(2, '0');

    const year = date.getFullYear();
    const month = pad(date.getMonth() + 1);
    const day = pad(date.getDate());

    const hours = pad(date.getHours());
    const minutes = pad(date.getMinutes());
    const seconds = pad(date.getSeconds());

    const offset = -date.getTimezoneOffset();
    const sign = offset >= 0 ? '+' : '-';
    const offsetHours = pad(Math.floor(Math.abs(offset) / 60));
    const offsetMinutes = pad(Math.abs(offset) % 60);
    const timezone = `${sign}${offsetHours}${offsetMinutes}`;

    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds} ${timezone}`;
}

function generateCNonce() {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

document.querySelector('#totpValidate').addEventListener('submit', async (e) => {
    e.preventDefault();
    const uname = e.target.querySelector('#ci-username').value;
    const pword = e.target.querySelector('#ci-password').value;
    const doc = soapSchema.structXML(true);
    console.log(doc);
    const header = doc.querySelector('soap:Header');
    const body = doc.querySelector('soap:Body');
    header.innerHTML = `
        <wsse:Security soap:mustUnderstand="0" xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
            <wsse:UsernameToken>
                <wsse:Username>pearson</wsse:Username>
                <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordDigest">AAAAAAAAAAAAAAAAAAAAAAAAAAA=</wsse:Password>
            </wsse:UsernameToken>
        </wsse:Security>
    `;
    body.appendChild(soapSchema.createLoginToPublicPortal(doc, {
        username: { cdata: uname },
        password: { cdata: pword }
    }));

    console.log(new XMLSerializer().serializeToString(doc));
});