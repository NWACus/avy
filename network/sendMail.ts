import {Platform} from 'react-native';

import {Logger} from 'browser-bunyan';

import * as FileSystem from 'expo-file-system';
import * as Linking from 'expo-linking';
import * as MailComposer from 'expo-mail-composer';

interface SendMailProps {
  to: string;
  subject: string;
  body?: string;
  attachments?: string[];
  logger?: Logger;
}

export const sendMail = async ({to, subject, body, attachments, logger}: SendMailProps): Promise<boolean> => {
  // MailComposer is not working correctly on iOS - use a mailto link on that platform
  // Filed https://github.com/expo/expo/issues/24613 to get an answer/resolution
  if (Platform.OS === 'android') {
    try {
      if (await MailComposer.isAvailableAsync()) {
        const status = await MailComposer.composeAsync({
          recipients: [to], // ['developer@nwac.us'],
          subject,
          body,
          attachments,
        });
        logger?.info('Sent mail to', to, 'with subject', subject, 'status', status);
      } else {
        logger?.error(`MailComposer.isAvailableAsync() returned false, unable to send mail to ${to} with subject ${subject}`);
      }
    } catch (e) {
      logger?.error('Unexpected error sending mail to', to, 'with subject', subject, 'error', e);
    }
  } else {
    try {
      const attachmentContents = (await Promise.all((attachments || []).map(a => FileSystem.readAsStringAsync(a)))).join('\n');
      const bodyWithAttachments = encodeURIComponent(`${body || ''}\n${attachmentContents}`.slice(0, 1024));
      const url = `mailto:${encodeURIComponent(to)}?subject=${encodeURIComponent(subject)}${bodyWithAttachments.length > 0 ? `&body=${bodyWithAttachments}` : ''}`;
      await Linking.openURL(url);
      logger?.info('Opened mailto url:', url);
    } catch (e) {
      logger?.error('Error opening mailto: link:', e);
    }
  }
  return Promise.resolve(true);
};
