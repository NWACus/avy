/* eslint-disable react/jsx-no-bind */
// Debug-only screen for the Member auth POC (ADR 026), reached from the Developer Menu.

import React, {useCallback, useContext, useEffect, useState} from 'react';

import {ScrollView, StyleSheet, TextInput} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';

import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {MainStackParamList} from 'routes';

import {ClientContext} from 'clientContext';
import {Button} from 'components/content/Button';
import {Card} from 'components/content/Card';
import {VStack} from 'components/core';
import {Body, BodySm, BodySmSemibold, Title3Black} from 'components/text';
import {LoggerContext, LoggerProps} from 'loggerContext';
import {
  dropStoredSession,
  forgetDevice,
  getMemberAuthClient,
  getSession,
  readDeviceIdentity,
  registerDevice,
  requestDeleteMember,
  restoreSession,
  sendEmailOtp,
  signInAnonymously,
  signInWithGoogleIdToken,
  signOut,
  verifyEmailOtp,
} from 'network/memberAuth';
import {colorLookup} from 'theme';

const signInWithGoogle = async (host: string) => {
  // Imported lazily so a dev client built without the native module still opens this screen.
  const {GoogleSignin, isSuccessResponse} = await import('@react-native-google-signin/google-signin');
  const webClientId = process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID as string | undefined;
  if (!webClientId) {
    throw new Error('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID is not set');
  }
  GoogleSignin.configure({webClientId, iosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID as string | undefined});
  await GoogleSignin.hasPlayServices();
  const response = await GoogleSignin.signIn();
  if (!isSuccessResponse(response)) {
    throw new Error('Google sign-in was cancelled');
  }
  if (!response.data.idToken) {
    throw new Error('Google returned no idToken; is webClientId the web OAuth client?');
  }
  return signInWithGoogleIdToken(getMemberAuthClient(host), response.data.idToken);
};

export const MemberAuthDebugScreen = (_: NativeStackScreenProps<MainStackParamList, 'memberAuthDebug'>) => {
  const {avyWebHost} = useContext(ClientContext);
  const {logger} = useContext<LoggerProps>(LoggerContext);
  // The client is built from `host`, and Better Auth throws on a half-typed URL, so the field edits a
  // draft and `host` follows it only while it holds a valid URL.
  const [host, setHost] = useState((process.env.EXPO_PUBLIC_AVY_WEB_HOST as string | undefined) || avyWebHost);
  const [hostDraft, setHostDraft] = useState(host);
  const [installId, setInstallId] = useState<string | null>(null);
  const [session, setSession] = useState<unknown>(null);
  const [status, setStatus] = useState<string>('');
  const [busy, setBusy] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');

  const refresh = useCallback(async () => {
    setInstallId((await readDeviceIdentity())?.installId ?? null);
    setSession(await getSession(getMemberAuthClient(host)));
  }, [host]);

  const run = useCallback(
    async (label: string, action: () => Promise<unknown>) => {
      setBusy(label);
      setStatus(`${label}…`);
      try {
        const result = await action();
        setStatus(`${label}: ${result === undefined ? 'ok' : JSON.stringify(result)}`);
        logger.info({result}, `member auth: ${label}`);
      } catch (error) {
        setStatus(`${label}: ${error instanceof Error ? error.message : String(error)}`);
        logger.warn({error}, `member auth: ${label} failed`);
      } finally {
        setBusy(null);
        try {
          await refresh();
        } catch (error) {
          logger.warn({error}, 'member auth: refresh failed');
        }
      }
    },
    [logger, refresh],
  );

  const loadSession = useCallback(() => void run('get-session', () => Promise.resolve(undefined)), [run]);
  useEffect(() => {
    loadSession();
    // Only on mount; host edits reload when editing ends, not on every keystroke.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const editHost = useCallback((text: string) => {
    setHostDraft(text);
    const candidate = text.trim().replace(/\/+$/, '');
    if (/^https?:\/\/[^/\s]+$/.test(candidate)) {
      setHost(candidate);
    }
  }, []);

  const client = getMemberAuthClient(host);
  const actions: {label: string; action: () => Promise<unknown>; disabled?: boolean; destructive?: boolean}[] = [
    {label: 'A: sign in anonymously', action: () => signInAnonymously(client)},
    {label: 'Drop stored session (keep device)', action: () => dropStoredSession()},
    {label: 'B: restore session (relaunch)', action: () => restoreSession(client)},
    {label: 'C1: send email OTP', action: () => sendEmailOtp(client, email.trim()), disabled: !email.trim()},
    {label: 'C2: verify email OTP', action: () => verifyEmailOtp(client, email.trim(), otp.trim()), disabled: !email.trim() || !otp.trim()},
    {label: 'D: sign in with Google', action: () => signInWithGoogle(host)},
    {label: 'Re-register device', action: () => registerDevice(client)},
    {label: 'Sign out', action: () => signOut(client)},
    {label: 'Request Member deletion', action: () => requestDeleteMember(client, `${host}/`), destructive: true},
    {label: 'Forget device', action: () => forgetDevice(), destructive: true},
  ];

  return (
    <SafeAreaView style={StyleSheet.absoluteFill} edges={['top', 'left', 'right']}>
      <ScrollView keyboardShouldPersistTaps="handled">
        <Card marginTop={1} borderRadius={0} borderColor="white" header={<Title3Black>Server</Title3Black>}>
          <VStack space={8}>
            <TextInput style={styles.input} value={hostDraft} onChangeText={editHost} onEndEditing={loadSession} autoCapitalize="none" autoCorrect={false} keyboardType="url" />
            <BodySm>Using: {host}</BodySm>
            <BodySm>Install id: {installId ?? 'none'}</BodySm>
          </VStack>
        </Card>
        <Card marginTop={1} borderRadius={0} borderColor="white" header={<Title3Black>Flows</Title3Black>}>
          <VStack space={8}>
            <TextInput style={styles.input} value={email} onChangeText={setEmail} placeholder="email" autoCapitalize="none" autoCorrect={false} keyboardType="email-address" />
            <TextInput style={styles.input} value={otp} onChangeText={setOtp} placeholder="OTP" keyboardType="number-pad" />
            {actions.map(({label, action, disabled, destructive}) => (
              <Button
                key={label}
                buttonStyle={destructive ? 'destructive' : 'normal'}
                busy={busy === label}
                disabled={disabled || busy !== null}
                onPress={() => void run(label, action)}>
                <BodySmSemibold>{label}</BodySmSemibold>
              </Button>
            ))}
            <BodySm>{status}</BodySm>
          </VStack>
        </Card>
        <Card marginTop={1} borderRadius={0} borderColor="white" header={<Title3Black>/get-session</Title3Black>}>
          <Body selectable>{JSON.stringify(session, null, 2)}</Body>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  input: {
    borderWidth: 1,
    borderColor: colorLookup('border.base'),
    borderRadius: 4,
    padding: 8,
  },
});
