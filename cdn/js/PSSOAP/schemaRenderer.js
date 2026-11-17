// handles PS' SOAP schema to create JSON/JS objects

const parser = new DOMParser();
const serializer = new XMLSerializer();
//const rootUrl = 'https://ps.westboroughk12.org/pearson-rest/services/PublicPortalService';
const rootUrl = 'https://md-api.bqbo.workers.dev/pearson-rest/services/PublicPortalService';
const userAgent = 'PowerSchool/1793340069 CFNetwork/3896.200.52 Darwin/27.2.0';


export function parseXML(xml) {
    const doc = parser.parseFromString(xml, 'text/xml');
    if (doc.querySelector('parsererror')) {
        console.error("Invalid XML:", doc.querySelector('parseError').textContent);
        document.querySelector('.fill-notif').style.display = 'block';
        document.querySelector('.fn-in .sh1').innerText = 'Parser Error';
        document.querySelector('.fn-in .sp').innerText = 'Meridian received an invalid or corrupt response from PowerSchool\'s servers.';
        document.querySelector('.fn-in .tvButton').innerText = 'Refresh';
        document.querySelector('.fn-in .tvButton').addEventListener('mouseup', () => {
            window.location.reload();
        });
        return;
    }
    return doc;
}

function createXML(documentName) {
    return document.implementation.createDocument(null, documentName);
}

export function createXMLSoap() {
    const template = `
        <soap:Envelope 
            xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" 
            xmlns:xsd="http://www.w3.org/2001/XMLSchema" 
            xmlns:soap="http://schemas.xmlsoap.org/soap/envelope/" 
            xmlns:wsu="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd" 
            xmlns="http://publicportal.rest.powerschool.pearson.com/xsd">
            <soap:Header></soap:Header>
            <soap:Body></soap:Body>
        </soap:Envelope>
    `.trim();

    const doc = new DOMParser().parseFromString(template, 'text/xml');
    const root = doc.documentElement;
    const soapNS = 'http://schemas.xmlsoap.org/soap/envelope/';

    return {
        doc,
        root,
        header: root.getElementsByTagNameNS(soapNS, 'Header')[0],
        body: root.getElementsByTagNameNS(soapNS, 'Body')[0]
    };
}

export function appendDeclaration(data) {
    return '<?xml version="1.0" encoding="UTF-8"?>' + data
}

export function constructLoginReq(username, password) {
    const xmlDoc = createXMLSoap();
    const doc = xmlDoc.doc;
    const root = xmlDoc.root;
    const header = xmlDoc.header;
    const body = xmlDoc.body;

    const wsseSecurity = doc.createElement('wsse:Security');
    wsseSecurity.setAttribute('soap:mustUnderstand', '0');
    wsseSecurity.setAttribute('xmlns:wsse', 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd');
    const wsseUsernameToken = doc.createElement('wsse:UsernameToken');
    const wsseUsername = doc.createElement('wsse:Username');
    wsseUsername.textContent = 'pearson';
    const wssePassword = doc.createElement('wsse:Password');
    wssePassword.setAttribute('Type', 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-username-token-profile-1.0#PasswordDigest');
    wssePassword.textContent = 'AAAAAAAAAAAAAAAAAAAAAAAAAAA=';
    wsseUsernameToken.appendChild(wsseUsername);
    wsseUsernameToken.appendChild(wssePassword);
    wsseSecurity.appendChild(wsseUsernameToken);
    header.appendChild(wsseSecurity);

    const loginToPublicPortal = doc.createElement('loginToPublicPortal');
    loginToPublicPortal.setAttribute('xmlns', 'http://publicportal.rest.powerschool.pearson.com/xsd');
    const lppUsername = doc.createElement('username');
    lppUsername.appendChild(doc.createCDATASection(username));
    const lppPassword = doc.createElement('password');
    lppPassword.appendChild(doc.createCDATASection(password));
    loginToPublicPortal.appendChild(lppUsername);
    loginToPublicPortal.appendChild(lppPassword);
    body.appendChild(loginToPublicPortal);
    root.appendChild(header);
    root.appendChild(body);

    return appendDeclaration(serializer.serializeToString(doc).replace(/ xmlns=""/g, '').replace(/\n/g, ''));
}