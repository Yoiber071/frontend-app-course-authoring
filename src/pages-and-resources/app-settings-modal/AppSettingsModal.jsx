import { injectIntl, intlShape } from '@edx/frontend-platform/i18n';
import {
  ActionRow, Badge, Form, Hyperlink, ModalDialog, StatefulButton, TransitionReplace,
} from '@edx/paragon';

import { Formik } from 'formik';
import PropTypes from 'prop-types';
import React, { useContext, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import * as Yup from 'yup';

import { RequestStatus } from '../../data/constants';
import ConnectionErrorAlert from '../../generic/ConnectionErrorAlert';
import FormSwitchGroup from '../../generic/FormSwitchGroup';
import Loading from '../../generic/Loading';
import { useModel } from '../../generic/model-store';
import PermissionDeniedAlert from '../../generic/PermissionDeniedAlert';
import { useIsMobile } from '../../utils';
import { getLoadingStatus, getSavingStatus } from '../data/selectors';
import { updateSavingStatus } from '../data/slice';
import { updateAppStatus } from '../data/thunks';
import AppConfigFormDivider from '../discussions/app-config-form/apps/shared/AppConfigFormDivider';
import { PagesAndResourcesContext } from '../PagesAndResourcesProvider';
import messages from './messages';

function AppSettingsForm({ formikProps, children }) {
  return children && (
    <TransitionReplace>
      {formikProps.values.enabled
        ? (
          <React.Fragment key="app-enabled">
            {children(formikProps)}
          </React.Fragment>
        ) : (
          <React.Fragment key="app-disabled" />
        )}
    </TransitionReplace>
  );
}

AppSettingsForm.propTypes = {
  formikProps: PropTypes.shape({
    values: PropTypes.shape({ enabled: PropTypes.bool.isRequired }),
  }).isRequired,
  children: PropTypes.func,
};

AppSettingsForm.defaultProps = {
  children: null,
};

function AppSettingsModalBase({
  intl, title, onClose, variant, isMobile, children, footer,
}) {
  return (
    <ModalDialog
      title={title}
      isOpen
      onClose={onClose}
      size="md"
      variant={variant}
      hasCloseButton={isMobile}
      isFullscreenOnMobile
    >
      <ModalDialog.Header>
        <ModalDialog.Title>
          {title}
        </ModalDialog.Title>
      </ModalDialog.Header>
      <ModalDialog.Body>
        {children}
      </ModalDialog.Body>
      <ModalDialog.Footer className="p-4">
        <ActionRow>
          <ModalDialog.CloseButton variant="tertiary">
            {intl.formatMessage(messages.cancel)}
          </ModalDialog.CloseButton>
          {footer}
        </ActionRow>
      </ModalDialog.Footer>
    </ModalDialog>
  );
}

AppSettingsModalBase.propTypes = {
  intl: intlShape.isRequired,
  title: PropTypes.string.isRequired,
  onClose: PropTypes.func.isRequired,
  variant: PropTypes.oneOf(['default', 'dark']).isRequired,
  isMobile: PropTypes.bool.isRequired,
  children: PropTypes.node.isRequired,
  footer: PropTypes.node,
};

AppSettingsModalBase.defaultProps = {
  footer: null,
};

function AppSettingsModal({
  intl,
  appId,
  title,
  children,
  initialValues,
  validationSchema,
  onClose,
  onSettingsSave,
  enableAppLabel,
  enableAppHelp,
  learnMoreText,
}) {
  const { courseId } = useContext(PagesAndResourcesContext);
  const loadingStatus = useSelector(getLoadingStatus);
  const updateSettingsRequestStatus = useSelector(getSavingStatus);
  const appInfo = useModel('courseApps', appId);
  const dispatch = useDispatch();
  const submitButtonState = updateSettingsRequestStatus === RequestStatus.IN_PROGRESS ? 'pending' : 'default';
  const isMobile = useIsMobile();
  const modalVariant = isMobile ? 'dark' : 'default';

  useEffect(() => {
    if (updateSettingsRequestStatus === RequestStatus.SUCCESSFUL) {
      dispatch(updateSavingStatus({ status: '' }));
      onClose();
    }
  }, [updateSettingsRequestStatus]);

  const handleFormSubmit = (values) => {
    if (appInfo.enabled !== values.enabled) {
      dispatch(updateAppStatus(courseId, appInfo.id, values.enabled));
    }
    // Call the submit handler for the settings component to save its settings
    if (onSettingsSave) {
      onSettingsSave(values);
    }
  };

  const learnMoreLink = appInfo.documentationLinks?.learnMoreConfiguration && (
    <Hyperlink
      className="text-primary-500"
      destination={appInfo.documentationLinks.learnMoreConfiguration}
      target="_blank"
      rel="noreferrer noopener"
    >
      {learnMoreText}
    </Hyperlink>
  );

  if (loadingStatus === RequestStatus.SUCCESSFUL) {
    return (
      <Formik
        initialValues={{
          enabled: !!appInfo?.enabled,
          ...initialValues,
        }}
        validationSchema={
          Yup.object()
            .shape({
              enabled: Yup.boolean(),
              ...validationSchema,
            })
        }
        onSubmit={handleFormSubmit}
      >
        {(formikProps) => (
          <Form
            onSubmit={formikProps.handleSubmit}
          >
            <AppSettingsModalBase
              title={title}
              isOpen
              onClose={onClose}
              size="md"
              variant={modalVariant}
              isMobile={isMobile}
              isFullscreenOnMobile
              intl={intl}
              footer={(
                <StatefulButton
                  labels={{
                    default: intl.formatMessage(messages.save),
                    pending: intl.formatMessage(messages.saving),
                    complete: intl.formatMessage(messages.saved),
                  }}
                  state={submitButtonState}
                  onClick={formikProps.handleSubmit}
                />
              )}
            >
              <FormSwitchGroup
                id={`enable-${appId}-toggle`}
                name="enabled"
                onChange={(event) => formikProps.handleChange(event)}
                onBlur={formikProps.handleBlur}
                checked={formikProps.values.enabled}
                label={(
                  <div className="d-flex align-items-center">
                    {enableAppLabel}
                    {formikProps.values.enabled && (
                      <Badge className="ml-2" variant="success">
                        {intl.formatMessage(messages.enabled)}
                      </Badge>
                    )}
                  </div>
                )}
                helpText={(
                  <div>
                    <p>{enableAppHelp}</p>
                    <span className="py-3">{learnMoreLink}</span>
                  </div>
                )}
              />
              {formikProps.values.enabled && children
              && <AppConfigFormDivider marginAdj={{ default: 0, sm: 0 }} />}
              <AppSettingsForm formikProps={formikProps}>
                {children}
              </AppSettingsForm>
            </AppSettingsModalBase>
          </Form>
        )}
      </Formik>
    );
  }
  return (
    <AppSettingsModalBase
      intl={intl}
      title={title}
      isOpen
      onClose={onClose}
      size="sm"
      variant={modalVariant}
      isMobile={isMobile}
      isFullscreenOnMobile
    >
      {loadingStatus === RequestStatus.IN_PROGRESS && <Loading />}
      {loadingStatus === RequestStatus.FAILED && <ConnectionErrorAlert />}
      {loadingStatus === RequestStatus.DENIED && <PermissionDeniedAlert />}
    </AppSettingsModalBase>
  );
}

AppSettingsModal.propTypes = {
  intl: intlShape.isRequired,
  title: PropTypes.string.isRequired,
  appId: PropTypes.string.isRequired,
  children: PropTypes.func,
  onSettingsSave: PropTypes.func,
  initialValues: PropTypes.objectOf(PropTypes.any),
  validationSchema: PropTypes.objectOf(PropTypes.any),
  onClose: PropTypes.func.isRequired,
  enableAppLabel: PropTypes.string.isRequired,
  enableAppHelp: PropTypes.string.isRequired,
  learnMoreText: PropTypes.string.isRequired,
};

AppSettingsModal.defaultProps = {
  children: null,
  onSettingsSave: null,
  initialValues: {},
  validationSchema: {},
};

export default injectIntl(AppSettingsModal);
