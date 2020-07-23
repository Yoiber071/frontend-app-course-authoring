import PropTypes from 'prop-types';
import React, { useState, useEffect } from 'react';
import EmailValidator from 'email-validator';
import moment from 'moment';
import {
  Button, CheckBox, Input, ValidationFormGroup, StatusAlert,
} from '@edx/paragon';
import { getAuthenticatedUser } from '@edx/frontend-platform/auth';

import StudioApiService from '../data/services/StudioApiService';

function ExamSettings(props) {
  const [loading, setLoading] = useState(true);
  const [loaded, setLoaded] = useState(false);
  const [loadingConnectionError, setLoadingConnectionError] = useState(false);
  const [loadingPermissionError, setLoadingPermissionError] = useState(false);
  const [enableProctoredExams, setEnableProctoredExams] = useState(true);
  const [allowOptingOut, setAllowOptingOut] = useState(false);
  const [proctoringProvider, setProctoringProvider] = useState('');
  const [availableProctoringProviders, setAvailableProctoringProviders] = useState([]);
  // TODO: we'll probably want to hide this field when proctortrack is not selected; currently,
  // this causes some errors in the browser console
  const [proctortrackEscalationEmail, setProctortrackEscalationEmail] = useState('');
  const [createZendeskTickets, setCreateZendeskTickets] = useState(false);
  const [proctortrackEscalationEmailError, setProctortrackEscalationEmailError] = useState('');
  const [courseStartDate, setCourseStartDate] = useState('');

  function onEnableProctoredExamsChange(event) {
    setEnableProctoredExams(event);
  }

  function onAllowOptingOutChange(event) {
    setAllowOptingOut(event);
  }

  function onCreateZendeskTicketsChange(event) {
    setCreateZendeskTickets(event);
  }

  function onProctoringProviderChange(event) {
    const provider = event.target.value;
    setProctoringProvider(provider);

    if (provider === 'proctortrack') {
      setCreateZendeskTickets(false);
    } else if (provider === 'software_secure') {
      setCreateZendeskTickets(true);
    }
  }

  function onProctortrackEscalationEmailChange(event) {
    setProctortrackEscalationEmail(event.target.value);
  }

  function onButtonClick() {
    if (proctoringProvider === 'proctortrack' && !EmailValidator.validate(proctortrackEscalationEmail)) {
      setProctortrackEscalationEmailError('A valid escalation email must be provided if '
                                            + 'Proctortrack is the selected provider.');
    } else {
      setProctortrackEscalationEmailError('');
    // TODO: implement POST
    }
  }

  function cannotEditProctoringProvider() {
    const currentDate = moment(moment()).format('YYYY-MM-DD[T]hh:mm:ss[Z]');
    const isAfterCourseStart = currentDate > courseStartDate;

    const isAdmin = getAuthenticatedUser().administrator;

    // if the user is  not an administrator and it is after the course start date, user cannot edit proctoring provider
    return !isAdmin && isAfterCourseStart;
  }

  function isDisabledOption(provider) {
    let markDisabled = false;
    if (cannotEditProctoringProvider()) {
      markDisabled = provider !== proctoringProvider;
    }
    return markDisabled;
  }

  function getProctoringProviderOptions(providers) {
    return providers.reduce(
      (accumulator, currentValue) => {
        accumulator.push({
          value: currentValue,
          label: currentValue,
          disabled: isDisabledOption(currentValue),
        }); return accumulator;
      }, [],
    );
  }

  function renderContent() {
    return (
      <div className="content-container">
        <ValidationFormGroup
          for="enableProctoredExams"
          helpText="If checked, proctored exams are enabled in your course."
        >
          <CheckBox
            id="enableProctoredExams"
            name="enable_proctored_exams"
            label="Enable Proctored Exams"
            checked={enableProctoredExams}
            onChange={onEnableProctoredExamsChange}
          />
        </ValidationFormGroup>
        <ValidationFormGroup
          for="allowingOptingOut"
          helpText="If checked, learners can choose to take proctored exams without proctoring. If not checked, all learners must take the exam with proctoring."
        >
          <CheckBox
            id="allowingOptingOut"
            name="allow_opting_out"
            label="Allow Opting Out of Proctored Exams"
            checked={allowOptingOut}
            onChange={onAllowOptingOutChange}
          />
        </ValidationFormGroup>
        <ValidationFormGroup
          for="proctoringProvider"
          helpText={cannotEditProctoringProvider() ? ('Proctoring provider cannot be modified after course start date.') : ('Select the proctoring provider you want to use for this course run.')}
        >
          <label htmlFor="proctoringProvider">Proctoring Provider</label>
          <Input
            type="select"
            id="proctoringProvider"
            name="proctoring_provider"
            options={getProctoringProviderOptions(availableProctoringProviders)}
            value={proctoringProvider}
            onChange={onProctoringProviderChange}
          />
        </ValidationFormGroup>
        <ValidationFormGroup
          for="proctortrackEscalationEmail"
          helpText="Required if 'proctortrack' is selected as your proctoring provider. Enter an email address to be contacted by the support team whenever there are escalations (e.g. appeals, delayed reviews, etc.)."
        >
          <label htmlFor="proctortrackEscalationEmail">Proctortrack Escalation Email</label>
          <Input
            type="text"
            id="proctortrackEscalationEmail"
            name="proctortrack_escalation_email"
            value={proctortrackEscalationEmail}
            onChange={onProctortrackEscalationEmailChange}
          />
        </ValidationFormGroup>
        <ValidationFormGroup
          for="createZendeskTickets"
          helpText="If checked, a Zendesk ticket will be created for suspicious attempts."
        >
          <CheckBox
            id="createZendeskTickets"
            name="create_zendesk_tickets"
            label="Create Zendesk Tickets For Suspicious Exam Attempts"
            checked={createZendeskTickets}
            onChange={onCreateZendeskTicketsChange}
          />
        </ValidationFormGroup>
        { proctortrackEscalationEmailError
        && (
        <StatusAlert
          alertType="danger"
          className="proctortrackEscalationEmailError"
          dialog={proctortrackEscalationEmailError}
          open
          dismissible={false}
        />
        )}
        <Button
          className="btn-primary mb-3"
          onClick={onButtonClick}
        >
          Submit
        </Button>
      </div>
    );
  }

  function renderLoading() {
    return (
      <div className="Loading-container">
        <div
          className="d-flex justify-content-center align-items-center flex-column"
          style={{
            height: '50vh',
          }}
        >
          <div className="spinner-border text-primary" role="status" />
        </div>
      </div>
    );
  }

  function renderConnectionError() {
    return (
      <div className="justify-content-center align-items-center flex-column">
        <div className="alert alert-danger">
          We encountered a technical error when loading this page.
          This might be a temporary issue, so please try again in a few minutes.
          If the problem persists, please go to <a href="https://support.edx.org/hc/en-us">edX Support Page</a> for help.
        </div>
      </div>
    );
  }

  function renderPermissionError() {
    return (
      <div className="justify-content-center align-items-center flex-column">
        <div className="alert alert-danger">
          You are not authorized to view this page. If you feel you should have access,
          please reach out to your course team admin to be given access.
        </div>
      </div>
    );
  }

  useEffect(
    () => {
      StudioApiService.getProctoredExamSettingsData(props.courseId)
        .then(
          response => {
            const proctoredExamSettings = response.data.proctored_exam_settings;
            setLoaded(true);
            setLoading(false);
            setCourseStartDate(response.data.course_start_date);
            setEnableProctoredExams(proctoredExamSettings.enable_proctored_exams);
            setAllowOptingOut(proctoredExamSettings.allow_proctoring_opt_out);
            setProctoringProvider(proctoredExamSettings.proctoring_provider);
            setAvailableProctoringProviders(response.data.available_proctoring_providers);
            setProctortrackEscalationEmail(proctoredExamSettings.proctoring_escalation_email);
            setCreateZendeskTickets(proctoredExamSettings.create_zendesk_tickets);
          },
        ).catch(
          errorDetails => {
            if (errorDetails.customAttributes.httpErrorStatus === 403) {
              setLoadingPermissionError(true);
            } else {
              setLoadingConnectionError(true);
            }
            setLoading(false);
            setLoaded(false);
          },
        );
    }, [],
  );

  return (
    <div className="container">
      <h2 className="mb-1">
        Proctored Exam Settings
      </h2>
      <div>
        {loading ? renderLoading() : null}
        {loaded ? renderContent() : null}
        {loadingConnectionError ? renderConnectionError() : null}
        {loadingPermissionError ? renderPermissionError() : null}
      </div>
    </div>
  );
}

ExamSettings.propTypes = {
  courseId: PropTypes.string.isRequired,
};

ExamSettings.defaultProps = {};

export default ExamSettings;