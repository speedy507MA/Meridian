import * as soapSchema from './PSSOAP/schemaParser.js';
import '/cdn/js/md5.js';

const MAX_RETRIES = 2;

const md5 = globalThis.md5;
const rootUrl = 'https://md-api.bqbo.workers.dev/pearson-rest/services/PublicPortalService';
const rootUrlJSON = 'https://md-api.bqbo.workers.dev/pearson-rest/services/PublicPortalService?response=application/json';
const urlRootUrlJSON = new URL(rootUrlJSON);
const userAgent = 'PowerSchool/1793340069 CFNetwork/3896.200.52 Darwin/27.2.0';
const inputs = document.querySelectorAll('.tvInput');
const serializer = new XMLSerializer();

async function fetchWithRetry(input, init, maxRetries, timeout) {
    if (maxRetries === 0) return fetch(input, init);
    let result;
    for (let i = 1; i <= maxRetries; i++) {
        try {
            const controller = new AbortController();
            setTimeout(
                () => controller.abort(),
                timeout
            );
            init = init || {};
            init.signal = controller.signal;
            result = await fetch(input, init);
            return result;
        } catch (err) { }
    }
    return result;
}

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

function sendCriticalErrorReload(errorData) {
    window.alert('An error occurred that was unable to be recovered from. The website will reload to attempt to fix itself.' + errorData ? '\nIf you report this error to the developer, include this error message: ' + errorData + '.' : '');
    window.location.reload();
    return;
}

function sendError(title, description, buttonText, buttonAction) {
    const fillNotif = document.querySelector('.fill-notif');
    const titleElem = document.querySelector('.fn-in .sh1');
    const descElem = document.querySelector('.fn-in .sp');
    const buttonElem = document.querySelector('.fn-in .tvButton');

    if (!fillNotif || !titleElem || !descElem || !buttonElem) {
        sendCriticalErrorReload();
        return;
    }

    try {
        document.querySelector('.fill-notif').style.display = 'block';
        document.querySelector('.fn-in .sh1').innerText = title;
        document.querySelector('.fn-in .sp').innerText = description;
        document.querySelector('.fn-in .tvButton').innerText = buttonText;
        document.querySelector('.fn-in .tvButton').addEventListener('mouseup', () => {
            buttonAction();
        });
    } catch (err) {
        sendCriticalErrorReload(err.message);
    }
}

function sendErrorBox(title, desc, fbTitle, fbDesc) {
    const errorBox = document.getElementById('errorBox');
    if (!errorBox) {
        sendError('fbTitle', 'fbDesc', 'Refresh', window.location.reload);
        return;
    }
    errorBox.innerHTML = title ? title + ': ' + desc : desc;
    errorBox.style.display = 'block';
    return;
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

function generateCnonce() {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

document.querySelector('#totpValidate').addEventListener('submit', async (e) => {
    e.preventDefault();

    document.getElementById('process-notif').style.display = 'block';
    errorBox.style.display = 'none';

    const uname = e.target.querySelector('#ci-username').value;
    const pword = e.target.querySelector('#ci-password').value;
    const doc = soapSchema.structXML(true);
    const header = doc.getElementsByTagNameNS(soapSchema.NAMESPACES.SOAP, 'Header')[0];
    const body = doc.getElementsByTagNameNS(soapSchema.NAMESPACES.SOAP, 'Body')[0];
    const securityXml = `
    <wsse:Security soap:mustUnderstand="0"
        xmlns:soap="${soapSchema.NAMESPACES.SOAP}"
        xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
        <wsse:UsernameToken>
            <wsse:Username>pearson</wsse:Username>
            <wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordDigest">AAAAAAAAAAAAAAAAAAAAAAAAAAA=</wsse:Password>
        </wsse:UsernameToken>
    </wsse:Security>`;
    const securityDoc = new DOMParser().parseFromString(securityXml, 'application/xml');
    header.appendChild(doc.importNode(securityDoc.documentElement, true));
    body.appendChild(soapSchema.createLoginToPublicPortal(doc, {
        username: { cdata: uname },
        password: { cdata: pword }
    }));

    const loginXMLPayload = new XMLSerializer().serializeToString(doc).replaceAll(/ xmlns=""/g, '').replaceAll(/\n/g, '').replaceAll(/\t/g, '');

    let loginXMLResponse;
    try {
        loginXMLResponse = fetchWithRetry(rootUrl, {
            'headers': {
                'SOAPAction': 'urn:loginToPublicPortal',
                'stamp-of-time': formatLocalDateTime(),
                'Accept': '*/*',
                'Accept-Language': 'en-US, en;q=0.9',
                'Content-Type': 'text/xml; charset=UTF-8'
            },
            'method': 'POST',
            'body': loginXMLPayload,
            'credentials': 'include'
        }, 2, 5_000);
    } catch (err) {
        sendErrorBox(null, 'The login request failed. Code: ' + loginXMLResponse.status + ' (' + loginXMLResponse.statusText + ').', 'Critical Error', 'There was an issue logging into PowerSchool and the error failed to display.');
        return;
    }

    document.getElementById('process-notif').style.display = 'none';

    const loginXMLData = new DOMParser().parseFromString(await loginXMLResponse.text(), 'application/xml');

    const loginErrorMessage = loginXMLData.querySelector('messageVOs');
    if (loginErrorMessage) {
        sendErrorBox(loginErrorMessage.querySelector('title').textContent, loginErrorMessage.querySelector('description').textContent + '.', 'Critical Error', 'There was an issue logging into PowerSchool and the error failed to display.');
        return;
    }

    const studentId = parseInt(loginXMLData.querySelector('studentIDs').textContent);

    // headers to create proper nonce & http digest auth
    let headReqResp;
    try {
        // http digest auth
        headReqResp = await fetch(rootUrlJSON, {
            'method': 'HEAD'
        });
    } catch (_) { }
    const digestHeader = headReqResp.headers.get('Www-Authenticate');
    if (!digestHeader || digestHeader == '') {
        sendErrorBox(null, 'PowerSchool returned an empty or malformed handshake request.', 'Critical Error', 'PowerSchool returned an empty or malformed handshake request and error was unable to be displayed normally.');
        return;
    }
    const digestData = {
        'realm': digestHeader.match(/(?<=realm=")\w*/g)[0],
        'qop': digestHeader.match(/(?<=qop=")\w*/g)[0],
        'nonce': digestHeader.match(/(?<=nonce=")\w*(=?)*/g)[0]
    };
    if (!digestData.realm || !digestData.qop || !digestData.nonce) {
        sendErrorBox(null, 'PowerSchool returned an empty or malformed handshake request.', 'Critical Error', 'PowerSchool returned an empty or malformed handshake request and error was unable to be displayed normally.');
        return;
    }

    const doc2 = soapSchema.structXML(false);
    doc2.getElementsByTagNameNS(soapSchema.NAMESPACES.SOAP, 'Body')[0].appendChild(soapSchema.createGetStudentData(doc2, {
        'userSessionVO': soapSchema.createUserSessionVO(doc2, {
            'serviceTicket': '',
            'userId': studentId,
            'userType': 2
        }),
        'studentIDs': studentId,
        'qil': soapSchema.createQueryIncludeListVO(doc2, {
            'includes': [1]
        })
    }));

    console.log(new XMLSerializer().serializeToString(doc2).replaceAll(/ xmlns=""/g, '').replaceAll(/\n/g, '').replaceAll(/\t/g, ''));

    const hash1 = md5('pearson:Protected:m0bApP5');
    const hash2 = md5('POST:' + urlRootUrlJSON.pathname + urlRootUrlJSON.search);
    const cnonce = generateCnonce();
    const digest = md5(hash1 + ':' + digestData.nonce + ":00000001:" + cnonce + ':' + digestData.qop + ':' + hash2);
    const authorizationHeader = `Digest username="pearson", realm="${digestData.realm}", nonce="${digestData.nonce}", uri="${urlRootUrlJSON.pathname + urlRootUrlJSON.search}", response="${digest}", cnonce="${cnonce}", nc=00000001, qop="${digestData.qop}"`;
    const studentDataResponse = await fetchWithRetry(rootUrlJSON, {
        'headers': {
            'Content-Type': 'text/xml; charset=UTF-8',
            'SOAPAction': 'urn:getStudentData',
            'Accept-Encoding': 'gzip, deflate, br',
            'stamp-of-time': formatLocalDateTime(),
            'Accept': '*/*',
            'Accept-Language': 'en-US, en;q=0.9',
            'User-Agent': userAgent,
            'Authorization': authorizationHeader
        },
        'method': 'POST',
        'body': new XMLSerializer().serializeToString(doc2).replaceAll(/ xmlns=""/g, '').replaceAll(/\n/g, '').replaceAll(/\t/g, ''),
        'credentials': 'include'
    }, 2, 5_000);

    const resppp = await studentDataResponse.text();
    console.log(resppp);
    const newWin = window.open('', 'PSData');
    if (newWin) {
        const p = newWin.document.createElement('p');
        p.textContent = resppp;
        newWin.document.body.appendChild(p);
    }
});