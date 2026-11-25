import * as soapSchema from './PSSOAP/schemaParser.js';
import '/cdn/js/md5.js';

document.getElementById('process-notif').style.display = 'block';

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

function formatXMLNS(xmlDoc) {
    return xmlDoc.replaceAll(/ xmlns=""/g, '').replaceAll(/\n/g, '').replaceAll(/\t/g, '');
}

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

let dataReqResp;
try {
    dataReqResp = await sendPowerSchoolRequest(((doc) => {
        doc.getElementsByTagNameNS(soapSchema.NAMESPACES.SOAP, 'Body')[0].appendChild(soapSchema.createGetStudentData(doc, {
            'userSessionVO': soapSchema.createUserSessionVO(doc, {
                'serviceTicket': '',
                'userId': studentId,
                'userType': 2
            }),
            'studentIDs': studentId,
            'qil': soapSchema.createQueryIncludeListVO(doc, {
                'includes': [1]
            })
        }));
        return doc;
    })(soapSchema.structXML(false)), rootUrlJSON, { 'headers': { 'Accept-Encoding': 'gzip, deflate, br' }, 'method': 'POST' }, 'urn:getStudentData', true, true, rootUrl);
} catch (e) {
    sendError('Request Error', 'There was a problem requesting your grades from PowerSchool.\nError Details (if any): ' + e.message, 'Refresh', window.location.reload);
    throw e;
}

document.getElementById('process-notif').style.display = 'none';

const dataReqXML = new DOMParser().parseFromString(await dataReqResp.text(), 'application/xml');
console.log(dataReqXML);
window.drxml = dataReqXML;
if (dataReqXML.querySelector('messageVOs msgCode') == 1) {
    eraseCookie('studentId');
    window.location.href = window.location.origin;
    window.location.replace(window.location.origin);
    document.body.style.display = 'none';
    throw new Error('Not logged in.');
}

let photoReqResp;
let usePhoto;
try {
    photoReqResp = await sendPowerSchoolRequest(((doc) => {
        doc.getElementsByTagNameNS(soapSchema.NAMESPACES.SOAP, 'Body')[0].appendChild(soapSchema.createGetStudentPhoto(doc, {
            'userSessionVO': soapSchema.createUserSessionVO(doc, {
                'serviceTicket': '',
                'userId': studentId,
                'userType': 2
            }),
            'studentID': studentId
        }));
        return doc;
    })(soapSchema.structXML(false)), rootUrlJSON, { 'method': 'POST' }, 'urn:getStudentPhoto', true, true, rootUrl);
    usePhoto = true;
} catch (e) {
    usePhoto = false;
    sendError('Request Error', 'Meridian was unable to fetch your student photo, so your profile picture will appear blank.', 'Ok', () => { });
    throw e;
}
try {
    if (usePhoto) {
        let photoReqXML = new DOMParser().parseFromString(await photoReqResp.text(), 'application/xml');
        const photoData = photoReqXML.querySelector('return').textContent;
        if (!photoData) throw 0
        const photo = document.querySelector('.npc-image');
        photo.src = 'data:image/jpeg;base64,' + photoReqXML.querySelector('return').textContent;
        photo.style.display = 'block';
        document.querySelector('.npc-placeholder').style.display = 'none';
    } else throw 0
} catch (e) { }

for (let item of document.querySelectorAll('.nlc-item')) {
    item.addEventListener('mouseup', () => {
        window.location.href = item.getAttribute('href');
    });
}

const studentDataVOs = dataReqXML.querySelector('studentDataVOs');
const studentFirstName = studentDataVOs.querySelector('student firstName').textContent;
const studentLastName = studentDataVOs.querySelector('student lastName').textContent;
const studentGradeLevel = studentDataVOs.querySelector('student gradeLevel').textContent;
document.querySelector('#welcome-message').innerHTML = 'Welcome' + (' ' + studentFirstName ? ', ' + studentFirstName + '!' : '!');
document.querySelector('#welcome-subtitle').innerHTML = 'Grade ' + studentGradeLevel;

// --- SETUP OUTSIDE YOUR FOR LOOP ---
const terms = [];
const records = [];

// Returns true if `outer` completely encloses `inner` (and they aren't identical)
function contains(outer, inner) {
    return (
        outer.start <= inner.start &&
        inner.end <= outer.end &&
        (outer.start < inner.start || inner.end < outer.end)
    );
}

// Returns true if `item` is a multi-term rollup (like a Semester or Full Year)
function isRollup(item) {
    const children = records.filter((other) => contains(item, other));

    // 1. Starts on the exact same timestamp as a shorter term inside it (e.g., S1 & Q1)
    if (children.some((child) => child.start === item.start)) {
        return true;
    }

    // 2. Encloses at least two non-overlapping terms (e.g., Q1 & Q2 inside S1)
    for (let i = 0; i < children.length; i++) {
        for (let j = i + 1; j < children.length; j++) {
            if (children[i].end <= children[j].start || children[j].end <= children[i].start) {
                return true;
            }
        }
    }

    return false;
}

function compareTerms(a, b) {
    // Case 1: `a` encloses `b`
    if (contains(a, b)) {
        // Rollups (S1, S2, Y1) go AFTER what they contain; quarters (Q2, Q4) go BEFORE exams (M1, F1)
        return isRollup(a) ? 1 : -1;
    }

    // Case 2: `b` encloses `a`
    if (contains(b, a)) {
        return isRollup(b) ? -1 : 1;
    }

    // Case 3: Neither encloses the other -> sort chronologically by start date
    return a.start - b.start;
}

// --- INSIDE YOUR FOR LOOP ---
// Uses only `term`, `startDate` (Date), and `endDate` (Date)
for (const term in dataReqXML.querySelectorAll('reportingTerms')) {
    const startDate = new Date(term.querySelector('startDate').textContent);
    const endDate = new Date(term.querySelector('endDate').textContent);

    records.push({
        term,
        start: startDate.getTime(),
        end: endDate.getTime(),
    });

    records.sort(compareTerms);

    terms.length = 0;
    for (const record of records) {
        terms.push(record.term);
    }
}

console.log(terms);
console.log(records);