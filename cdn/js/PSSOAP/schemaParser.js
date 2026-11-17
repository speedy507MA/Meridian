/**
 * PowerSchool PublicPortalServiceJSON SOAP XML Builder
 * Auto-generated from WSDL / XSD definitions.
 */

export const NAMESPACES = {
    SOAP: 'http://schemas.xmlsoap.org/soap/envelope/',
    XSI: 'http://www.w3.org/2001/XMLSchema-instance',
    XSD: 'http://www.w3.org/2001/XMLSchema',
    WSU: 'http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-utility-1.0.xsd',
    DEFAULT: 'http://publicportal.rest.powerschool.pearson.com/xsd',
    VO: 'http://vo.rest.powerschool.pearson.com/xsd',
    UTIL: 'http://util.java/xsd',
    MODEL: 'http://model.rest.powerschool.pearson.com/xsd',
};

/**
 * Creates a new SOAP XMLDocument with the requested Envelope and namespaces.
 * @param {boolean} [includeHeader=true] - Toggles the presence of the <soap:Header> element.
 * @returns {XMLDocument}
 */
export function structXML(includeHeader = true) {
    const headerStr = includeHeader ? '\n  <soap:Header></soap:Header>' : '';
    const baseXml = `<?xml version="1.0" encoding="UTF-8"?>
<soap:Envelope xmlns:xsi="${NAMESPACES.XSI}" xmlns:xsd="${NAMESPACES.XSD}" xmlns:soap="${NAMESPACES.SOAP}" xmlns:wsu="${NAMESPACES.WSU}" xmlns="${NAMESPACES.DEFAULT}">${headerStr}
  <soap:Body></soap:Body>
</soap:Envelope>`;

    // Browser environment
    if (typeof DOMParser !== 'undefined') {
        const parser = new DOMParser();
        return parser.parseFromString(baseXml, 'application/xml');
    }

    // Node.js fallback (requires @xmldom/xmldom or similar global DOMParser)
    throw new Error('DOMParser is not available in this environment.');
}

// ============================================================================
// Internal Helper Utilities
// ============================================================================

/**
 * Validates and appends child elements (simple values, CDATA, or complex Elements/Arrays)
 * according to the XSD schema rules.
 */
function buildComplexElement(doc, tagName, namespaceURI, schemaSpec, data = {}) {
    const el = namespaceURI
        ? doc.createElementNS(namespaceURI, tagName)
        : doc.createElement(tagName);

    for (const field of schemaSpec) {
        const {
            name,
            required = false,
            unbounded = false,
            isComplex = false,
            nillable = false,
            ns = null,
        } = field;

        const val = data ? data[name] : undefined;

        // 1. Check required constraint (elements without minOccurs="0")
        if (required && (val === undefined || val === null)) {
            throw new Error(`Validation Error in <${tagName}>: Missing required element <${name}>.`);
        }

        if (val === undefined) {
            continue;
        }

        // 2. Handle explicit null for nillable elements
        if (val === null) {
            if (nillable) {
                const nilEl = ns ? doc.createElementNS(ns, name) : doc.createElement(name);
                nilEl.setAttributeNS(NAMESPACES.XSI, 'xsi:nil', 'true');
                el.appendChild(nilEl);
                continue;
            } else {
                throw new Error(`Validation Error in <${tagName}>: Element <${name}> is not nillable.`);
            }
        }

        // 3. Normalize unbounded arrays vs single items
        const items = Array.isArray(val) ? val : [val];
        if (!unbounded && Array.isArray(val)) {
            throw new Error(`Validation Error in <${tagName}>: Element <${name}> does not allow multiple occurrences.`);
        }
        if (unbounded && required && items.length === 0) {
            throw new Error(`Validation Error in <${tagName}>: Required unbounded element <${name}> must contain at least one item.`);
        }

        // 4. Append each item
        for (const item of items) {
            if (isComplex) {
                if (typeof item === 'object' && item.nodeType === 1) {
                    // If the passed Element already matches the target field tagName, append directly;
                    // otherwise wrap it inside <name>
                    if (item.localName === name || item.nodeName === name) {
                        el.appendChild(item);
                    } else {
                        const wrapper = ns ? doc.createElementNS(ns, name) : doc.createElement(name);
                        wrapper.appendChild(item);
                        el.appendChild(wrapper);
                    }
                } else {
                    throw new Error(`Validation Error in <${tagName}>: Complex element <${name}> requires an XML Element.`);
                }
            } else {
                // Simple type (or explicit CDATA descriptor { cdata: "..." })
                const childEl = ns ? doc.createElementNS(ns, name) : doc.createElement(name);
                if (item !== null && typeof item === 'object' && 'cdata' in item) {
                    childEl.appendChild(doc.createCDATASection(String(item.cdata)));
                } else if (item !== null && typeof item === 'object' && item.nodeType === 1) {
                    childEl.appendChild(item);
                } else {
                    childEl.textContent = String(item);
                }
                el.appendChild(childEl);
            }
        }
    }

    return el;
}

// ============================================================================
// Namespace: http://util.java/xsd (ax2109)
// ============================================================================

export function createLocale(doc, data = {}, tagName = 'locale') {
    return buildComplexElement(doc, tagName, null, [
        { name: 'ISO3Country', nillable: true },
        { name: 'ISO3Language', nillable: true },
        { name: 'country', nillable: true },
        { name: 'displayCountry', nillable: true },
        { name: 'displayLanguage', nillable: true },
        { name: 'displayName', nillable: true },
        { name: 'displayScript', nillable: true },
        { name: 'displayVariant', nillable: true },
        { name: 'extensionKeys', unbounded: true, nillable: true },
        { name: 'language', nillable: true },
        { name: 'script', nillable: true },
        { name: 'unicodeLocaleAttributes', unbounded: true, nillable: true },
        { name: 'unicodeLocaleKeys', unbounded: true, nillable: true },
        { name: 'variant', nillable: true },
    ], data);
}

// ============================================================================
// Namespace: http://model.rest.powerschool.pearson.com/xsd (ax2111)
// ============================================================================

export function createServerInfo(doc, data = {}, tagName = 'serverInfo') {
    return buildComplexElement(doc, tagName, null, [
        { name: 'apiVersion', nillable: true },
        { name: 'dayLightSavings' },
        { name: 'parentSAMLEndPoint', nillable: true },
        { name: 'parentSAMLV2EndPoint', nillable: true },
        { name: 'publicPortalDisabled' },
        { name: 'publicPortalDisabledMessage', nillable: true },
        { name: 'rawOffset' },
        { name: 'serverTime', nillable: true },
        { name: 'standardTimeZoneName', nillable: true },
        { name: 'studentSAMLEndPoint', nillable: true },
        { name: 'studentSAMLV2EndPoint', nillable: true },
        { name: 'teacherSAMLEndPoint', nillable: true },
        { name: 'timeZoneName', nillable: true },
    ], data);
}

export function createBulletinLite(doc, data = {}, tagName = 'bulletins') {
    return buildComplexElement(doc, tagName, null, [
        { name: 'audience' },
        { name: 'body', nillable: true },
        { name: 'endDate', nillable: true },
        { name: 'id' },
        { name: 'name', nillable: true },
        { name: 'schoolId' },
        { name: 'sortOrder' },
        { name: 'startDate', nillable: true },
    ], data);
}

// ============================================================================
// Namespace: http://vo.rest.powerschool.pearson.com/xsd (ax2108 / ax2113)
// ============================================================================

export function createUserSessionVO(doc, data = {}, tagName = 'userSessionVO') {
    return buildComplexElement(doc, tagName, null, [
        { name: 'locale', isComplex: true, nillable: true },
        { name: 'serverCurrentTime', nillable: true },
        { name: 'serverInfo', isComplex: true, nillable: true },
        { name: 'serviceTicket', nillable: true },
        { name: 'studentIDs', unbounded: true, nillable: true },
        { name: 'ucProfileURIs', unbounded: true, nillable: true },
        { name: 'ucToken', nillable: true },
        { name: 'userId' },
        { name: 'userType' },
    ], data);
}

export function createMessageVO(doc, data = {}, tagName = 'messageVOs') {
    return buildComplexElement(doc, tagName, null, [
        { name: 'description', nillable: true },
        { name: 'id', nillable: true },
        { name: 'msgCode' },
        { name: 'title', nillable: true },
    ], data);
}

export function createRedirectURLResultVO(doc, data = {}, tagName = 'return') {
    return buildComplexElement(doc, tagName, null, [
        { name: 'messageVOs', unbounded: true, isComplex: true, nillable: true },
        { name: 'redirectURL', nillable: true },
    ], data);
}

export function createNotificationSettingsVO(doc, data = {}, tagName = 'ns') {
    return buildComplexElement(doc, tagName, null, [
        { name: 'applyToAllStudents' },
        { name: 'balanceAlerts' },
        { name: 'detailedAssignments' },
        { name: 'detailedAttendance' },
        { name: 'emailAddresses', unbounded: true, nillable: true },
        { name: 'frequency' },
        { name: 'gradeAndAttSummary' },
        { name: 'guardianStudentId' },
        { name: 'mainEmail', nillable: true },
        { name: 'schoolAnnouncements' },
        { name: 'sendNow' },
    ], data);
}

export function createResultsVO(doc, data = {}, tagName = 'return') {
    return buildComplexElement(doc, tagName, null, [
        { name: 'messageVOs', unbounded: true, isComplex: true, nillable: true },
        { name: 'studentDataVOs', unbounded: true, isComplex: true, nillable: true },
        { name: 'userSessionVO', isComplex: true, nillable: true },
    ], data);
}

export function createStudentDataVO(doc, data = {}, tagName = 'studentDataVOs') {
    return buildComplexElement(doc, tagName, null, [
        { name: 'activities', unbounded: true, isComplex: true, nillable: true },
        { name: 'archivedFinalGrades', unbounded: true, isComplex: true, nillable: true },
        { name: 'assignmentCategories', unbounded: true, isComplex: true, nillable: true },
        { name: 'assignmentScores', unbounded: true, isComplex: true, nillable: true },
        { name: 'assignments', unbounded: true, isComplex: true, nillable: true },
        { name: 'attendance', unbounded: true, isComplex: true, nillable: true },
        { name: 'attendanceCodes', unbounded: true, isComplex: true, nillable: true },
        { name: 'bulletins', unbounded: true, isComplex: true, nillable: true },
        { name: 'citizenCodes', unbounded: true, isComplex: true, nillable: true },
        { name: 'citizenGrades', unbounded: true, isComplex: true, nillable: true },
        { name: 'customPage', unbounded: true, isComplex: true, nillable: true },
        { name: 'enrollments', unbounded: true, isComplex: true, nillable: true },
        { name: 'extension', nillable: true },
        { name: 'feeBalance', isComplex: true, nillable: true },
        { name: 'feeTransactions', unbounded: true, isComplex: true, nillable: true },
        { name: 'feeTypes', unbounded: true, isComplex: true, nillable: true },
        { name: 'finalGrades', unbounded: true, isComplex: true, nillable: true },
        { name: 'gradeScales', unbounded: true, isComplex: true, nillable: true },
        { name: 'lunchTransactions', unbounded: true, isComplex: true, nillable: true },
        { name: 'notInSessionDays', unbounded: true, isComplex: true, nillable: true },
        { name: 'notificationSettingsVO', isComplex: true, nillable: true },
        { name: 'periods', unbounded: true, isComplex: true, nillable: true },
        { name: 'remoteSchools', unbounded: true, isComplex: true, nillable: true },
        { name: 'reportingTerms', unbounded: true, isComplex: true, nillable: true },
        { name: 'schools', unbounded: true, isComplex: true, nillable: true },
        { name: 'sections', unbounded: true, isComplex: true, nillable: true },
        { name: 'standards', unbounded: true, isComplex: true, nillable: true },
        { name: 'standardsGrades', unbounded: true, isComplex: true, nillable: true },
        { name: 'student', isComplex: true, nillable: true },
        { name: 'studentDcid' },
        { name: 'studentId' },
        { name: 'teachers', unbounded: true, isComplex: true, nillable: true },
        { name: 'terms', unbounded: true, isComplex: true, nillable: true },
        { name: 'yearId' },
    ], data);
}

export function createActivityVO(doc, data = {}, tagName = 'activities') {
    return buildComplexElement(doc, tagName, null, [
        { name: 'category', nillable: true },
        { name: 'id' },
        { name: 'name', nillable: true },
        { name: 'required' },
    ], data);
}

export function createFinalGradeVO(doc, data = {}, tagName = 'finalGrades') {
    return buildComplexElement(doc, tagName, null, [
        { name: 'commentValue', nillable: true },
        { name: 'dateStored', nillable: true },
        { name: 'grade', nillable: true },
        { name: 'id' },
        { name: 'percent' },
        { name: 'reportingTermId' },
        { name: 'sectionid' },
        { name: 'storeType' },
    ], data);
}

export function createArchivedFinalGradeVO(doc, data = {}, tagName = 'archivedFinalGrades') {
    return buildComplexElement(doc, tagName, null, [
        // Inherited from FinalGradeVO
        { name: 'commentValue', nillable: true },
        { name: 'dateStored', nillable: true },
        { name: 'grade', nillable: true },
        { name: 'id' },
        { name: 'percent' },
        { name: 'reportingTermId' },
        { name: 'sectionid' },
        { name: 'storeType' },
        // ArchivedFinalGradeVO extensions
        { name: 'courseName', nillable: true },
        { name: 'courseNumber', nillable: true },
        { name: 'schoolId' },
        { name: 'sortOrder' },
        { name: 'storeCode', nillable: true },
        { name: 'teacherName', nillable: true },
        { name: 'termEndDate', nillable: true },
        { name: 'termId' },
        { name: 'termStartDate', nillable: true },
        { name: 'yearId' },
    ], data);
}

export function createAsmtCatVO(doc, data = {}, tagName = 'assignmentCategories') {
    return buildComplexElement(doc, tagName, null, [
        { name: 'abbreviation', nillable: true },
        { name: 'description', nillable: true },
        { name: 'gradeBookType' },
        { name: 'id' },
        { name: 'name', nillable: true },
    ], data);
}

export function createAssignmentScoreVO(doc, data = {}, tagName = 'assignmentScores') {
    return buildComplexElement(doc, tagName, null, [
        { name: 'assignmentId' },
        { name: 'collected' },
        { name: 'comment', nillable: true },
        { name: 'exempt' },
        { name: 'gradeBookType' },
        { name: 'id' },
        { name: 'incomplete' },
        { name: 'late' },
        { name: 'letterGrade', nillable: true },
        { name: 'missing' },
        { name: 'percent', nillable: true },
        { name: 'score', nillable: true },
        { name: 'scoretype' },
    ], data);
}

export function createAssignmentVO(doc, data = {}, tagName = 'assignments') {
    return buildComplexElement(doc, tagName, null, [
        { name: 'abbreviation', nillable: true },
        { name: 'additionalCategoryIds', unbounded: true, nillable: true },
        { name: 'assignmentid' },
        { name: 'categoryId' },
        { name: 'description', nillable: true },
        { name: 'dueDate', nillable: true },
        { name: 'gradeBookType' },
        { name: 'id' },
        { name: 'includeinfinalgrades' },
        { name: 'name', nillable: true },
        { name: 'pointspossible' },
        { name: 'publishDaysBeforeDue' },
        { name: 'publishState' },
        { name: 'publishonspecificdate', nillable: true },
        { name: 'publishscores' },
        { name: 'sectionDcid' },
        { name: 'sectionid' },
        { name: 'type' },
        { name: 'weight' },
    ], data);
}

export function createAttendanceVO(doc, data = {}, tagName = 'attendance') {
    return buildComplexElement(doc, tagName, null, [
        { name: 'adaValueCode' },
        { name: 'adaValueTime' },
        { name: 'admValue' },
        { name: 'attCodeid' },
        { name: 'attComment', nillable: true },
        { name: 'attDate', nillable: true },
        { name: 'attFlags' },
        { name: 'attInterval' },
        { name: 'attModeCode', nillable: true },
        { name: 'ccid' },
        { name: 'id' },
        { name: 'periodid' },
        { name: 'schoolid' },
        { name: 'studentid' },
        { name: 'totalMinutes' },
        { name: 'transactionType', nillable: true },
        { name: 'yearid' },
    ], data);
}

export function createAttendanceCodeVO(doc, data = {}, tagName = 'attendanceCodes') {
    return buildComplexElement(doc, tagName, null, [
        { name: 'attCode', nillable: true },
        { name: 'codeType', nillable: true },
        { name: 'description', nillable: true },
        { name: 'id' },
        { name: 'schoolid' },
        { name: 'sortorder', nillable: true },
        { name: 'yearid', nillable: true },
    ], data);
}

export function createCitizenCodeVO(doc, data = {}, tagName = 'citizenCodes') {
    return buildComplexElement(doc, tagName, null, [
        { name: 'codeName', nillable: true },
        { name: 'description', nillable: true },
        { name: 'id' },
        { name: 'sortOrder' },
    ], data);
}

export function createCitizenGradeVO(doc, data = {}, tagName = 'citizenGrades') {
    return buildComplexElement(doc, tagName, null, [
        { name: 'codeId' },
        { name: 'reportingTermId' },
        { name: 'sectionId' },
        { name: 'storeType' },
    ], data);
}

export function createCustomPageVO(doc, data = {}, tagName = 'customPage') {
    return buildComplexElement(doc, tagName, null, [
        { name: 'formIcon', nillable: true },
        { name: 'formTitle', nillable: true },
        { name: 'redirectURL', nillable: true },
    ], data);
}

export function createSectionEnrollmentVO(doc, data = {}, tagName = 'enrollments') {
    return buildComplexElement(doc, tagName, null, [
        { name: 'endDate', nillable: true },
        { name: 'enrollStatus' },
        { name: 'id' },
        { name: 'startDate', nillable: true },
    ], data);
}

export function createFeeBalanceVO(doc, data = {}, tagName = 'feeBalance') {
    return buildComplexElement(doc, tagName, null, [
        { name: 'balance' },
        { name: 'credit' },
        { name: 'debit' },
        { name: 'id' },
        { name: 'schoolid' },
        { name: 'yearid' },
    ], data);
}

export function createFeeTransactionVO(doc, data = {}, tagName = 'feeTransactions') {
    return buildComplexElement(doc, tagName, null, [
        { name: 'adjustment', nillable: true },
        { name: 'courseName', nillable: true },
        { name: 'courseNumber', nillable: true },
        { name: 'creationdate', nillable: true },
        { name: 'dateValue', nillable: true },
        { name: 'departmentName', nillable: true },
        { name: 'description', nillable: true },
        { name: 'feeAmount', nillable: true },
        { name: 'feeBalance', nillable: true },
        { name: 'feeCategoryName', nillable: true },
        { name: 'feePaid', nillable: true },
        { name: 'feeTypeId' },
        { name: 'feeTypeName', nillable: true },
        { name: 'feecharged', nillable: true },
        { name: 'groupTransactionId' },
        { name: 'id' },
        { name: 'modificationdate', nillable: true },
        { name: 'originalfee', nillable: true },
        { name: 'priority', nillable: true },
        { name: 'proRated', nillable: true },
        { name: 'schoolfeeId' },
        { name: 'schoolid' },
        { name: 'termid' },
    ], data);
}

export function createFeeTypeVO(doc, data = {}, tagName = 'feeTypes') {
    return buildComplexElement(doc, tagName, null, [
        { name: 'descript', nillable: true },
        { name: 'feeCategoryName', nillable: true },
        { name: 'id' },
        { name: 'schoolNumber' },
        { name: 'sort' },
        { name: 'title', nillable: true },
    ], data);
}

export function createGradeScaleVO(doc, data = {}, tagName = 'gradeScales') {
    return buildComplexElement(doc, tagName, null, [
        { name: 'description', nillable: true },
        { name: 'gradeBookType' },
        { name: 'gradeScaleItems', unbounded: true, isComplex: true, nillable: true },
        { name: 'id' },
        { name: 'name', nillable: true },
        { name: 'numeric' },
        { name: 'numericMax' },
        { name: 'numericMin' },
        { name: 'numericPrecision' },
        { name: 'numericScale' },
    ], data);
}

export function createGradeScaleItemVO(doc, data = {}, tagName = 'gradeScaleItems') {
    return buildComplexElement(doc, tagName, null, [
        { name: 'cutoffPercent', nillable: true },
        { name: 'defaultZeroCutoff' },
        { name: 'description', nillable: true },
        { name: 'gradeBookType' },
        { name: 'gradeLabel', nillable: true },
        { name: 'id' },
        { name: 'percentValue', nillable: true },
        { name: 'pointsValue', nillable: true },
        { name: 'sortOrder' },
    ], data);
}

export function createLunchTransactionVO(doc, data = {}, tagName = 'lunchTransactions') {
    return buildComplexElement(doc, tagName, null, [
        { name: 'cash', nillable: true },
        { name: 'credit', nillable: true },
        { name: 'dateValue', nillable: true },
        { name: 'debit', nillable: true },
        { name: 'description', nillable: true },
        { name: 'id', nillable: true },
        { name: 'mealprice', nillable: true },
        { name: 'neteffect', nillable: true },
        { name: 'time', nillable: true },
    ], data);
}

export function createNotInSessionDayVO(doc, data = {}, tagName = 'notInSessionDays') {
    return buildComplexElement(doc, tagName, null, [
        { name: 'calType', nillable: true },
        { name: 'calendarDay', nillable: true },
        { name: 'description', nillable: true },
        { name: 'id' },
        { name: 'schoolNumber' },
    ], data);
}

export function createPeriodVO(doc, data = {}, tagName = 'periods') {
    return buildComplexElement(doc, tagName, null, [
        { name: 'abbreviation', nillable: true },
        { name: 'id' },
        { name: 'name', nillable: true },
        { name: 'periodNumber' },
        { name: 'schoolid' },
        { name: 'sortOrder' },
        { name: 'yearid' },
    ], data);
}

export function createSchoolVO(doc, data = {}, tagName = 'schools') {
    return buildComplexElement(doc, tagName, null, [
        { name: 'abbreviation', nillable: true },
        { name: 'address', nillable: true },
        { name: 'currentTermId' },
        { name: 'disabledFeatures', isComplex: true, nillable: true },
        { name: 'highGrade', nillable: true },
        { name: 'lowGrade', nillable: true },
        { name: 'mapMimeType', nillable: true },
        { name: 'name', nillable: true },
        { name: 'schoolDisabled' },
        { name: 'schoolDisabledMessage', nillable: true },
        { name: 'schoolDisabledTitle', nillable: true },
        { name: 'schoolId' },
        { name: 'schoolMapModifiedDate', nillable: true },
        { name: 'schoolNumber' },
        { name: 'schooladdress', nillable: true },
        { name: 'schoolcity', nillable: true },
        { name: 'schoolcountry', nillable: true },
        { name: 'schoolfax', nillable: true },
        { name: 'schoolphone', nillable: true },
        { name: 'schoolstate', nillable: true },
        { name: 'schoolzip', nillable: true },
    ], data);
}

export function createDisabledFeaturesVO(doc, data = {}, tagName = 'disabledFeatures') {
    return buildComplexElement(doc, tagName, null, [
        { name: 'activities' },
        { name: 'assignments' },
        { name: 'attendance' },
        { name: 'citizenship' },
        { name: 'currentGpa' },
        { name: 'emailalerts' },
        { name: 'fees' },
        { name: 'finalGrades' },
        { name: 'meals' },
        { name: 'pushAttendance' },
        { name: 'pushGrade' },
        { name: 'standards' },
    ], data);
}

export function createReportingTermVO(doc, data = {}, tagName = 'reportingTerms') {
    return buildComplexElement(doc, tagName, null, [
        { name: 'abbreviation', nillable: true },
        { name: 'endDate', nillable: true },
        { name: 'id' },
        { name: 'schoolid' },
        { name: 'sendingGrades' },
        { name: 'sortOrder' },
        { name: 'startDate', nillable: true },
        { name: 'suppressGrades' },
        { name: 'suppressPercents' },
        { name: 'termid' },
        { name: 'title', nillable: true },
        { name: 'yearid' },
    ], data);
}

export function createSectionVO(doc, data = {}, tagName = 'sections') {
    return buildComplexElement(doc, tagName, null, [
        { name: 'courseCode', nillable: true },
        { name: 'dcid' },
        { name: 'description', nillable: true },
        { name: 'enrollments', unbounded: true, isComplex: true, nillable: true },
        { name: 'expression', nillable: true },
        { name: 'gradeBookType' },
        { name: 'id' },
        { name: 'periodSort', nillable: true },
        { name: 'roomName', nillable: true },
        { name: 'schoolCourseTitle', nillable: true },
        { name: 'schoolNumber' },
        { name: 'sectionNum', nillable: true },
        { name: 'startStopDates', unbounded: true, isComplex: true, nillable: true },
        { name: 'teacherID' },
        { name: 'termID' },
    ], data);
}

export function createStartStopDateVO(doc, data = {}, tagName = 'startStopDates') {
    return buildComplexElement(doc, tagName, null, [
        { name: 'sectionEnrollmentId' },
        { name: 'start', nillable: true },
        { name: 'stop', nillable: true },
    ], data);
}

export function createStandardVO(doc, data = {}, tagName = 'standards') {
    return buildComplexElement(doc, tagName, null, [
        { name: 'description', nillable: true },
        { name: 'gradeBookType' },
        { name: 'gradeScaleID' },
        { name: 'id' },
        { name: 'identifier', nillable: true },
        { name: 'name', nillable: true },
        { name: 'parentStandardID' },
        { name: 'sortOrder' },
    ], data);
}

export function createStandardGradeVO(doc, data = {}, tagName = 'standardsGrades') {
    return buildComplexElement(doc, tagName, null, [
        { name: 'comment', nillable: true },
        { name: 'commentLastUpdated', nillable: true },
        { name: 'exempt' },
        { name: 'gradeBookType' },
        { name: 'gradeEntered', nillable: true },
        { name: 'gradeLastUpdated', nillable: true },
        { name: 'gradeType' },
        { name: 'id' },
        { name: 'late' },
        { name: 'missing' },
        { name: 'reportingTermId' },
        { name: 'sectionDcid' },
        { name: 'sectionId' },
        { name: 'standardId' },
    ], data);
}

export function createStudentVO(doc, data = {}, tagName = 'student') {
    return buildComplexElement(doc, tagName, null, [
        { name: 'currentGPA', nillable: true },
        { name: 'currentMealBalance' },
        { name: 'currentTerm', nillable: true },
        { name: 'dcid' },
        { name: 'dob', nillable: true },
        { name: 'ethnicity', nillable: true },
        { name: 'firstName', nillable: true },
        { name: 'gender', nillable: true },
        { name: 'gradeLevel' },
        { name: 'guardianAccessDisabled' },
        { name: 'id' },
        { name: 'lastName', nillable: true },
        { name: 'middleName', nillable: true },
        { name: 'photoDate', nillable: true },
        { name: 'startingMealBalance' },
    ], data);
}

export function createTeacherVO(doc, data = {}, tagName = 'teachers') {
    return buildComplexElement(doc, tagName, null, [
        { name: 'email', nillable: true },
        { name: 'firstName', nillable: true },
        { name: 'id' },
        { name: 'lastName', nillable: true },
        { name: 'schoolPhone', nillable: true },
    ], data);
}

export function createTermVO(doc, data = {}, tagName = 'terms') {
    return buildComplexElement(doc, tagName, null, [
        { name: 'abbrev', nillable: true },
        { name: 'endDate', nillable: true },
        { name: 'id' },
        { name: 'parentTermId' },
        { name: 'schoolNumber', nillable: true },
        { name: 'startDate', nillable: true },
        { name: 'suppressed' },
        { name: 'title', nillable: true },
    ], data);
}

export function createPasswordResetVO(doc, data = {}, tagName = 'return') {
    return buildComplexElement(doc, tagName, null, [
        { name: 'messageVOs', unbounded: true, isComplex: true, nillable: true },
        { name: 'minPasswordLength' },
        { name: 'serviceTicket', nillable: true },
        { name: 'successful' },
    ], data);
}

export function createQueryIncludeListVO(doc, data = {}, tagName = 'qil') {
    return buildComplexElement(doc, tagName, null, [
        { name: 'includes', unbounded: true, nillable: true },
    ], data);
}

export function createCredentialComplexityRulesVO(doc, data = {}, tagName = 'return') {
    return buildComplexElement(doc, tagName, null, [
        { name: 'messageVOs', unbounded: true, isComplex: true, nillable: true },
        { name: 'lettersAndNumRequired' },
        { name: 'mixOfCaseRequired' },
        { name: 'requiredCharacterCount' },
        { name: 'specialCharacterRequired' },
        { name: 'successful' },
    ], data);
}

// ============================================================================
// Namespace: http://publicportal.rest.powerschool.pearson.com/xsd (ns)
// Root Operation Elements (Requests & Responses)
// ============================================================================

export function createValidateServiceToken(doc, data = {}) {
    return buildComplexElement(doc, 'validateServiceToken', NAMESPACES.DEFAULT, [
        { name: 'userSessionVO', isComplex: true, nillable: true },
        { name: 'redirectURL', nillable: true },
    ], data);
}

export function createValidateServiceTokenResponse(doc, data = {}) {
    return buildComplexElement(doc, 'validateServiceTokenResponse', NAMESPACES.DEFAULT, [
        { name: 'return', isComplex: true, nillable: true },
    ], data);
}

export function createStoreNotificationSettings(doc, data = {}) {
    return buildComplexElement(doc, 'storeNotificationSettings', NAMESPACES.DEFAULT, [
        { name: 'userSessionVO', isComplex: true, nillable: true },
        { name: 'ns', isComplex: true, nillable: true },
    ], data);
}

export function createStoreNotificationSettingsResponse(doc, data = {}) {
    return buildComplexElement(doc, 'storeNotificationSettingsResponse', NAMESPACES.DEFAULT, [
        { name: 'return', isComplex: true, nillable: true },
    ], data);
}

export function createSendPasswordRecoveryEmail(doc, data = {}) {
    return buildComplexElement(doc, 'sendPasswordRecoveryEmail', NAMESPACES.DEFAULT, [
        { name: 'userType', required: true },
        { name: 'userName', nillable: true },
        { name: 'emailAddress', nillable: true },
    ], data);
}

export function createSendPasswordRecoveryEmailResponse(doc, data = {}) {
    return buildComplexElement(doc, 'sendPasswordRecoveryEmailResponse', NAMESPACES.DEFAULT, [
        { name: 'return', isComplex: true, nillable: true },
    ], data);
}

export function createRecoverUsername(doc, data = {}) {
    return buildComplexElement(doc, 'recoverUsername', NAMESPACES.DEFAULT, [
        { name: 'emailAddress', nillable: true },
    ], data);
}

export function createRecoverUsernameResponse(doc, data = {}) {
    return buildComplexElement(doc, 'recoverUsernameResponse', NAMESPACES.DEFAULT, [
        { name: 'return', isComplex: true, nillable: true },
    ], data);
}

export function createRecoverPassword(doc, data = {}) {
    return buildComplexElement(doc, 'recoverPassword', NAMESPACES.DEFAULT, [
        { name: 'userType', required: true },
        { name: 'userName', nillable: true },
        { name: 'recoveryToken', nillable: true },
        { name: 'newPassword', nillable: true },
    ], data);
}

export function createRecoverPasswordResponse(doc, data = {}) {
    return buildComplexElement(doc, 'recoverPasswordResponse', NAMESPACES.DEFAULT, [
        { name: 'return', isComplex: true, nillable: true },
    ], data);
}

export function createLogoutAndDelinkDeviceToken(doc, data = {}) {
    return buildComplexElement(doc, 'logoutAndDelinkDeviceToken', NAMESPACES.DEFAULT, [
        { name: 'userSessionVO', isComplex: true, nillable: true },
        { name: 'deviceToken', nillable: true },
    ], data);
}

export function createLogoutAndDelinkDeviceTokenResponse(doc, data = {}) {
    return buildComplexElement(doc, 'logoutAndDelinkDeviceTokenResponse', NAMESPACES.DEFAULT, [
        { name: 'return', isComplex: true, nillable: true },
    ], data);
}

export function createLogout(doc, data = {}) {
    return buildComplexElement(doc, 'logout', NAMESPACES.DEFAULT, [
        { name: 'userSessionVO', isComplex: true, nillable: true },
    ], data);
}

export function createLogoutResponse(doc, data = {}) {
    return buildComplexElement(doc, 'logoutResponse', NAMESPACES.DEFAULT, [
        { name: 'return', isComplex: true, nillable: true },
    ], data);
}

export function createLoginToPublicPortal(doc, data = {}) {
    return buildComplexElement(doc, 'loginToPublicPortal', NAMESPACES.DEFAULT, [
        { name: 'username', nillable: true },
        { name: 'password', nillable: true },
    ], data);
}

export function createLoginToPublicPortalResponse(doc, data = {}) {
    return buildComplexElement(doc, 'loginToPublicPortalResponse', NAMESPACES.DEFAULT, [
        { name: 'return', isComplex: true, nillable: true },
    ], data);
}

export function createLogin(doc, data = {}) {
    return buildComplexElement(doc, 'login', NAMESPACES.DEFAULT, [
        { name: 'username', nillable: true },
        { name: 'password', nillable: true },
        { name: 'userType', required: true },
    ], data);
}

export function createLoginResponse(doc, data = {}) {
    return buildComplexElement(doc, 'loginResponse', NAMESPACES.DEFAULT, [
        { name: 'return', isComplex: true, nillable: true },
    ], data);
}

export function createLinkDeviceTokenToUser(doc, data = {}) {
    return buildComplexElement(doc, 'linkDeviceTokenToUser', NAMESPACES.DEFAULT, [
        { name: 'userSessionVO', isComplex: true, nillable: true },
        { name: 'deviceToken', nillable: true },
    ], data);
}

export function createLinkDeviceTokenToUserResponse(doc, data = {}) {
    return buildComplexElement(doc, 'linkDeviceTokenToUserResponse', NAMESPACES.DEFAULT, [
        { name: 'return', isComplex: true, nillable: true },
    ], data);
}

export function createGetStudentPhoto(doc, data = {}) {
    return buildComplexElement(doc, 'getStudentPhoto', NAMESPACES.DEFAULT, [
        { name: 'userSessionVO', isComplex: true, nillable: true },
        { name: 'studentID', required: true },
    ], data);
}

export function createGetStudentPhotoResponse(doc, data = {}) {
    return buildComplexElement(doc, 'getStudentPhotoResponse', NAMESPACES.DEFAULT, [
        { name: 'return', nillable: true },
    ], data);
}

export function createGetStudentData(doc, data = {}) {
    return buildComplexElement(doc, 'getStudentData', NAMESPACES.DEFAULT, [
        { name: 'userSessionVO', isComplex: true, nillable: true },
        { name: 'studentIDs', required: true, unbounded: true },
        { name: 'qil', isComplex: true, nillable: true },
    ], data);
}

export function createGetStudentDataResponse(doc, data = {}) {
    return buildComplexElement(doc, 'getStudentDataResponse', NAMESPACES.DEFAULT, [
        { name: 'return', isComplex: true, nillable: true },
    ], data);
}

export function createGetStartStopTimeForAllSections(doc, data = {}) {
    return buildComplexElement(doc, 'getStartStopTimeForAllSections', NAMESPACES.DEFAULT, [
        { name: 'userSessionVO', isComplex: true, nillable: true },
        { name: 'studentIDs', required: true, unbounded: true },
        { name: 'month', required: true },
        { name: 'year', required: true },
    ], data);
}

export function createGetStartStopTimeForAllSectionsResponse(doc, data = {}) {
    return buildComplexElement(doc, 'getStartStopTimeForAllSectionsResponse', NAMESPACES.DEFAULT, [
        { name: 'return', isComplex: true, nillable: true },
    ], data);
}

export function createGetSchoolMapBySchoolNumber(doc, data = {}) {
    return buildComplexElement(doc, 'getSchoolMapBySchoolNumber', NAMESPACES.DEFAULT, [
        { name: 'userSessionVO', isComplex: true, nillable: true },
        { name: 'schoolNumber', required: true },
    ], data);
}

export function createGetSchoolMapBySchoolNumberResponse(doc, data = {}) {
    return buildComplexElement(doc, 'getSchoolMapBySchoolNumberResponse', NAMESPACES.DEFAULT, [
        { name: 'return', nillable: true },
    ], data);
}

export function createGetCredentialComplexityRules(doc, data = {}) {
    return buildComplexElement(doc, 'getCredentialComplexityRules', NAMESPACES.DEFAULT, [
        { name: 'userType', required: true },
    ], data);
}

export function createGetCredentialComplexityRulesResponse(doc, data = {}) {
    return buildComplexElement(doc, 'getCredentialComplexityRulesResponse', NAMESPACES.DEFAULT, [
        { name: 'return', isComplex: true, nillable: true },
    ], data);
}

// ============================================================================
// Usage Example
// ============================================================================
/*
const doc = structXML(false); // Omit <soap:Header>
const body = doc.getElementsByTagNameNS(NAMESPACES.SOAP, 'Body')[0];

const sessionEl = createUserSessionVO(doc, {
  serviceTicket: 'abc-123-ticket',
  userId: 98765,
  userType: 2,
});

const qilEl = createQueryIncludeListVO(doc, {
  includes: [1, 2, 3],
});

const studentDataReq = createGetStudentData(doc, {
  userSessionVO: sessionEl,
  studentIDs: [1001, 1002], // Required (minOccurs="1", maxOccurs="unbounded")
  qil: qilEl,
});

body.appendChild(studentDataReq);
console.log(new XMLSerializer().serializeToString(doc));
*/