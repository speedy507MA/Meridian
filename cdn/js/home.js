import * as soapSchema from './PSSOAP/schemaParser.js';
import '/cdn/js/md5.js';

function setCookie(name, value, days) {
    var expires = "";
    if (days && typeof (days) != 'string') {
        var date = new Date();
        date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
        expires = "; expires=" + date.toUTCString();
    } else {
        expires = days || '';
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

const studentId = getCookie('studentId');
if (!studentId) {
    window.location.href = window.location.origin;
    window.location.replace(window.location.origin);
    document.body.style.display = 'none';
    throw new Error('Not logged in.');
}

const rootUrl = 'https://md-api.bqbo.workers.dev/pearson-rest/services/PublicPortalService';
const rootUrlJSON = 'https://md-api.bqbo.workers.dev/pearson-rest/services/PublicPortalService?response=application/json';
const urlRootUrlJSON = new URL(rootUrlJSON);
const userAgent = 'PowerSchool/1793340069 CFNetwork/3896.200.52 Darwin/27.2.0';

function generateCnonce() {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    return Array.from(bytes, (byte) => byte.toString(16).padStart(2, '0')).join('');
}

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
    if (!digestData.realm || !digestData.realm == '', !digestData.qop || !digestData.qop == '', !digestData.nonce || !digestData.nonce == '') throw new Error('PowerSchool didn\'t provide either the realm, nonce, or qop.');

    const h1 = md5('pearson:Protected:m0bApP5');
    const h2 = md5(method + ':' + url.pathname + url.search);
    const digest = md5(h1 + ':' + digestData.nonce + ':00000001:' + cnonce + ':' + digestData.qop + ':' + h2);
    return `Digest username="pearson", realm="${digestData.realm}", nonce="${digestData.nonce}", uri="${url.pathname + url.search}", response="${digest}", cnonce="${cnonce}", nc=00000001, qop="${digestData.qop}"`;
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

const authorizationHeader = await createAuthorizationHeader(rootUrlJSON, 'POST');

const studentDataResponse = await fetch(rootUrlJSON, {
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
});

const resppp = await studentDataResponse.text();
document.write(resppp);