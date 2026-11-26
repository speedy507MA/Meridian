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

if (dataReqXML?.querySelector('messageVOs msgCode')?.textContent == 1) {
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
document.querySelector('#welcome-message').innerHTML = studentFirstName + ' ' + studentLastName + ', Grade ' + studentGradeLevel;

const terms = [...dataReqXML.querySelectorAll('studentDataVOs > terms')];
const sections = [...dataReqXML.querySelectorAll('studentDataVOs > sections')];
const periods = [...dataReqXML.querySelectorAll('studentDataVOs > periods')];
const finalGrades = [...dataReqXML.querySelectorAll('studentDataVOs > finalGrades')];
const reportingTerms = [...dataReqXML.querySelectorAll('studentDataVOs > reportingTerms')];
const attendanceCodes = [...dataReqXML.querySelectorAll('studentDataVOs > attendanceCodes')];
const attendance = [...dataReqXML.querySelectorAll('studentDataVOs > attendance')];
const teachers = [...dataReqXML.querySelectorAll('studentDataVOs > teachers')];

document.querySelector('#welcome-date').innerHTML = terms.find(t => t.querySelector('parentTermId').textContent == '0').querySelector('title').textContent;

document.documentElement.style.setProperty('--course-count', dataReqXML.querySelectorAll('sections').length);

for (const section of sections) {
    const sectionName = section.querySelector('schoolCourseTitle').textContent;
    console.log(sectionName);
    const sectionCode = section.querySelector('courseCode').textContent;
    console.log(sectionCode);
    const sectionRoom = section.querySelector('roomName').textContent;
    console.log(sectionRoom);
    const sectionPeriod = periods.find(p => p.querySelector('sortOrder').textContent == section.querySelector('periodSort').textContent);
    const sectionPeriodName = parseInt(sectionPeriod.querySelector('name').textContent);
    console.log(sectionPeriodName);
    const sectionTerm = terms.find(t => t.querySelector('id').textContent == section.querySelector('termID').textContent);
    console.log(sectionTerm);
    const sectionMaxReportingTerm = reportingTerms.find(t => {
        const rEnd = new Date(t.querySelector('endDate').textContent);
        const rStart = new Date(t.querySelector('startDate').textContent);
        const tEnd = new Date(sectionTerm.querySelector('endDate').textContent);
        const tStart = new Date(sectionTerm.querySelector('startDate').textContent);
        return Math.abs((rEnd - rStart) - (tEnd - tStart)) <= (5 * 24 * 60 * 60 * 1000);
    });
    console.log(sectionMaxReportingTerm);

    const sectionFinalGrade = finalGrades.find(g => {
        const reportingId = sectionMaxReportingTerm.querySelector('id').textContent;
        const sectionId = section.querySelector('id').textContent;
        const grId = g.querySelector('reportingTermId').textContent;
        const gsId = g.querySelector('sectionid').textContent;
        console.log(reportingId, grId, sectionId, gsId);
        return (reportingId == grId) && (sectionId == gsId);
    });
    console.log(sectionFinalGrade);
    const sectionFinalGradeLetter = sectionFinalGrade.querySelector('grade').textContent;
    const sectionFinalGradePercentage = Math.round(parseFloat(sectionFinalGrade.querySelector('percent').textContent));
    const sectionAbsentCount = attendance.filter(a => {
        const code = a.querySelector('attCodeid').textContent;
        let aCode = attendanceCodes.filter(c => {
            const aCode = c.querySelector('attCode').textContent;
            return aCode == 'AE' || aCode == 'A' || aCode == 'AU' || aCode == 'TA';
        });
        aCode = aCode.map(c => c.querySelector('attCodeid').textContent);
        let found = false;
        for (const fCode of aCode) {
            found = fCode == code;
        }
        return found;
    }).length;
    const sectionTardyCount = attendance.filter(a => {
        const code = a.querySelector('attCodeid').textContent;
        let aCode = attendanceCodes.filter(c => {
            const aCode = c.querySelector('attCode').textContent;
            return aCode == 'TX' || aCode == 'TU';
        });
        aCode = aCode.map(c => c.querySelector('attCodeid').textContent);
        let found = false;
        for (const fCode of aCode) {
            found = fCode == code;
        }
        return found;
    }).length;
    const sectionTeacher = teachers.find(t => t.querySelector('id').textContent == section.querySelector('teacherID').textContent);
    const sectionTeacherId = parseInt(sectionTeacher.querySelector('id').textContent);
    const sectionTeacherFirstName = sectionTeacher.querySelector('firstName');
    const sectionTeacherLastName = sectionTeacher.querySelector('lastName');

    const gbItem = document.createElement('div');
    gbItem.className = 'gb-item';
    const gbiTop = document.createElement('div');
    gbiTop.className = 'gbi-top';
    const gbiTopLeft = document.createElement('div');
    gbiTopLeft.className = 'gbi-top-left';
    const gbiPeriod = document.createElement('small');
    gbiPeriod.className = 'gbi-period';
    gbiPeriod.innerHTML = sectionPeriodName;
    gbiTopLeft.appendChild(gbiPeriod);
    const gbiCourseCode = document.createElement('small');
    gbiCourseCode.className = 'gbi-courseCode';
    gbiCourseCode.innerHTML = sectionCode;
    gbiTopLeft.appendChild(gbiCourseCode);
    const gbiCourseName = document.createElement('h4');
    gbiCourseName.innerHTML = sectionName;
    gbiTopLeft.appendChild(gbiCourseName);
    const gbiExtraInfo = document.createElement('small');
    const gbiRoomNumber = document.createElement('span');
    gbiRoomNumber.innerHTML = sectionRoom;
    gbiExtraInfo.appendChild(gbiRoomNumber);
    const gbiTeacher = document.createElement('a');
    gbiTeacher.innerHTML = sectionTeacherFirstName + ' ' + sectionTeacherLastName;
    gbiExtraInfo.appendChild(gbiTeacher);
    gbiTopLeft.appendChild(gbiExtraInfo);
    gbiTop.appendChild(gbiTopLeft);
    const gbiTopMiddle = document.createElement('div');
    gbiTopMiddle.className = 'gbi-top-middle';
    gbiTop.appendChild(gbiTopMiddle);
    const gbiTopRight = document.createElement('div');
    gbiTopRight.className = 'gbi-top-right';
    const gbiLetterGrade = document.createElement('h4');
    gbiLetterGrade.innerHTML = sectionFinalGradeLetter;
    gbiTopRight.appendChild(gbiLetterGrade);
    const gbiPercentageGrade = document.createElement('small');
    gbiPercentageGrade.innerHTML = sectionFinalGradePercentage;
    gbiTopRight.appendChild(gbiPercentageGrade);
    gbiTop.appendChild(gbiTopRight);
    gbItem.appendChild(gbiTop);
    const gbiBottom = document.createElement('div');
    gbiBottom.className = 'gbi-bottom';
    const gbiAttendance = document.createElement('p');
    const gbiAbsences = document.createElement('span');
    gbiAbsences.className = 'gbi-absences';
    gbiAbsences.innerHTML = sectionAbsentCount;
    gbiAttendance.appendChild(gbiAbsences);
    gbiAttendance.innerHTML += ' absences, ';
    const gbiTardies = document.createElement('span');
    gbiTardies.className = 'gbi-tardies';
    gbiTardies.innerHTML = sectionTardyCount;
    gbiAttendance.appendChild(gbiTardies);
    gbiAttendance.innerHTML += ' tardies';
    gbiBottom.appendChild(gbiAttendance);
    gbItem.appendChild(gbiBottom);
    document.querySelector('.gradebook-container').appendChild(gbItem);
}