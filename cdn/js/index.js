import * as soapSchema from './PSSOAP/schemaParser.js';
import '/cdn/js/md5.js';

function setCookie(name, value, days) {
    var expires = "";
    if (days && typeof (days) != 'string') {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    } else {
        expires = '; expires=' + days || '';
    }

    document.cookie = name + "=" + (value || "") + expires + "; path=/";
}
function getCookie(name) {
    var nameEQ = name + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1, c.length);
        if (c.indexOf(nameEQ) == 0) return c.substring(nameEQ.length, c.length);
    }
    return null;
}
function eraseCookie(name) {
    document.cookie = name + '=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT;';
}

if (getCookie('studentId')) {
    document.querySelector('#process-notif h1').innerHTML = 'Attempting to Log You In'
    document.getElementById('process-notif').style.display = 'block';
    window.location.href = '/home.html';
    window.location.replace(window.location.origin + '/home.html');
    throw new Error('Halted execution to allow new window to load.');
}

const md5 = globalThis.md5;
const rootUrl = 'https://md-api.bqbo.workers.dev/pearson-rest/services/PublicPortalService';
const rootUrlJSON = 'https://md-api.bqbo.workers.dev/pearson-rest/services/PublicPortalService?response=application/json';
const urlRootUrlJSON = new URL(rootUrlJSON);
const userAgent = 'PowerSchool/1793340069 CFNetwork/3896.200.52 Darwin/27.2.0';
const inputs = document.querySelectorAll('.tvInput');
const serializer = new XMLSerializer();
const errorBox = document.getElementById('errorBox');

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

function formatXMLNS(xmlDoc) {
    return xmlDoc.replaceAll(/ xmlns=""/g, '').replaceAll(/\n/g, '').replaceAll(/\t/g, '');
}

function sendCriticalErrorReload(errorData) {
    window.alert('An error occurred that was unable to be recovered from. The website will reload to attempt to fix itself.' + errorData ? '\nIf you report this error to the developer, include this error message: ' + errorData + '.' : '');
    window.location.reload();
    return;
}

function sendError(title, description, buttonText, buttonAction) {
    const fillNotif = document.querySelector('.fill-notif');
    const titleElem = document.querySelector('.fn-in h1');
    const descElem = document.querySelector('.fn-in p');
    const buttonElem = document.querySelector('.fn-in .tvButton');

    if (!fillNotif || !titleElem || !descElem || !buttonElem) {
        sendCriticalErrorReload();
        return;
    }

    try {
        document.querySelector('.fill-notif').style.display = 'block';
        document.querySelector('.fn-in h1').innerText = title;
        document.querySelector('.fn-in p').innerText = description;
        document.querySelector('.fn-in .tvButton').innerText = buttonText;
        document.querySelector('.fn-in .tvButton').addEventListener('mouseup', () => {
            buttonAction();
            document.querySelector('.fill-notif').style.display = 'none';
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

async function createAuthorizationHeader(url, method, cnonce) {
    if (!url || !method) throw new Error('A valid URL and method must be provided.');
    if (!(url instanceof URL)) url = new URL(url);
    cnonce = cnonce || generateCnonce();
    const headReqResp = await fetch(url, {
        'method': 'HEAD'
    });

    const digestHeader = headReqResp.headers.get('Www-Authenticate');
    if (!digestHeader || digestHeader == '') throw new Error('PowerSchool\'s Digest header wasn\'t provided.');

    const digestData = {
        'realm': digestHeader.match(/(?<=realm=")\w*/g)[0],
        'qop': digestHeader.match(/(?<=qop=")\w*/g)[0],
        'nonce': digestHeader.match(/(?<=nonce=")\w*(=?)*/g)[0]
    };

    if (!digestData.realm?.trim() || !digestData.qop?.trim() || !digestData.nonce?.trim()) throw new Error('PowerSchool didn\'t provide either the realm, nonce, or qop.');

    const h1 = md5('pearson:Protected:m0bApP5');
    const h2 = md5(method + ':' + url.pathname + url.search);
    const digest = md5(h1 + ':' + digestData.nonce + ':00000001:' + cnonce + ':' + digestData.qop + ':' + h2);
    return `Digest username="pearson", realm="${digestData.realm}", nonce="${digestData.nonce}", uri="${url.pathname + url.search}", response="${digest}", cnonce="${cnonce}", nc=00000001, qop="${digestData.qop}"`;
}

async function sendPowerSchoolRequest(xmlDoc, url, requestData, soapAction, includeCredentials, hasDigest, customFetchUrl, authHeader) {
    if (!xmlDoc || !url || !soapAction) throw new Error('An XMLDocument, URL, and SOAP Action are required to fulfill this request.');
    requestData.headers = requestData.headers || {};
    requestData.body = xmlDoc instanceof String ? xmlDoc : formatXMLNS(new XMLSerializer().serializeToString(xmlDoc));
    requestData.headers['Content-Type'] = 'text/xml; charset=UTF-8';
    requestData.headers['SOAPAction'] = soapAction;
    requestData.headers['stamp-of-time'] = formatLocalDateTime();
    requestData.headers['Accept'] = '*/*';
    requestData.headers['Accept-Language'] = 'en-US, en;q=0.9';
    requestData.headers['User-Agent'] = userAgent;
    if (hasDigest) requestData.headers['Authorization'] = authHeader || await createAuthorizationHeader(url, requestData.method || 'GET');
    requestData.credentials = requestData.credentials || includeCredentials ? 'include' : null
    return fetch(customFetchUrl || url, requestData)
}

const loginForm = document.querySelector('#totpValidate');

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    document.getElementById('process-notif').style.display = 'block';
    errorBox.style.display = 'none';

    let loginXMLResponse;
    try {
        loginXMLResponse = await sendPowerSchoolRequest(((doc) => {
            doc.getElementsByTagNameNS(soapSchema.NAMESPACES.SOAP, 'Header')[0].appendChild(doc.importNode((new DOMParser().parseFromString(`<wsse:Security soap:mustUnderstand="0" xmlns:soap="${soapSchema.NAMESPACES.SOAP}" xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd"><wsse:UsernameToken><wsse:Username>pearson</wsse:Username><wsse:Password Type="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordDigest">AAAAAAAAAAAAAAAAAAAAAAAAAAA=</wsse:Password></wsse:UsernameToken></wsse:Security>`, 'application/xml')).documentElement, true));
            doc.getElementsByTagNameNS(soapSchema.NAMESPACES.SOAP, 'Body')[0].appendChild(soapSchema.createLoginToPublicPortal(doc, {
                'username': { 'cdata': e.target.querySelector('#ci-username').value },
                'password': { 'cdata': e.target.querySelector('#ci-password').value }
            }));
            return doc;
        })(soapSchema.structXML(true)), rootUrl, { 'method': 'POST' }, 'urn:loginToPublicPortal', true, false);

        document.getElementById('process-notif').style.display = 'none';

        const loginXMLData = new DOMParser().parseFromString(await loginXMLResponse.text(), 'application/xml');
        const loginErrorMessage = loginXMLData.querySelector('messageVOs');
        if (loginErrorMessage) {
            sendErrorBox(loginErrorMessage.querySelector('title').textContent, loginErrorMessage.querySelector('description').textContent + '.', 'Critical Error', 'There was an issue logging into PowerSchool and the error failed to display.')
        }

        setCookie('studentId', parseInt(loginXMLData.querySelector('studentIDs').textContent), 'Session');

        window.location.href = '/home.html';

        return;
    } catch (err) {
        sendErrorBox(null, loginXMLResponse ? 'The login request failed. Code: ' + loginXMLResponse.status + ' (' + loginXMLResponse.statusText + ').' : 'The login request failed.', 'Critical Error', 'There was an issue logging into PowerSchool and the error failed to display.');
        return;
    }
});