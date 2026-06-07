import React, {useCallback, useEffect, useState} from 'react';
import {View, Text, Button} from 'react-native';
import {useAppDispatch, useAppSelector} from '../../store';
import {setMessage} from '../../store/reducers/MessageSlice';
import DeviceInfo from 'react-native-device-info';
import {Dimensions, PixelRatio} from 'react-native';
import moment from 'moment-timezone';
import {JWTGenerator} from '../../JWTGenerator';
import generateJwtTokenJose from '../../JoseJWTGenerator';

const externalId = 'a7b3edb3-3312-495b-bded-76f02ef150c8';
const privateKeyPem = `-----BEGIN PRIVATE KEY-----
MIIEvwIBADANBgkqhkiG9w0BAQEFAASCBKkwggSlAgEAAoIBAQC7VJTUt9Us8cKj
MzEfYyjiWA4R4/M2bS1GB4t7NXp98C3SC6dVMvDuictGeurT8jNbvJZHtCSuYEvu
NMoSfm76oqFvAp8Gy0iz5sxjZmSnXyCdPEovGhLa0VzMaQ8s+CLOyS56YyCFGeJZ
qgtzJ6GR3eqoYSW9b9UMvkBpZODSctWSNGj3P7jRFDO5VoTwCQAWbFnOjDfH5Ulg
p2PKSQnSJP3AJLQNFNe7br1XbrhV//eO+t51mIpGSDCUv3E0DDFcWDTH9cXDTTlR
ZVEiR2BwpZOOkE/Z0/BVnhZYL71oZV34bKfWjQIt6V/isSMahdsAASACp4ZTGtwi
VuNd9tybAgMBAAECggEBAKTmjaS6tkK8BlPXClTQ2vpz/N6uxDeS35mXpqasqskV
laAidgg/sWqpjXDbXr93otIMLlWsM+X0CqMDgSXKejLS2jx4GDjI1ZTXg++0AMJ8
sJ74pWzVDOfmCEQ/7wXs3+cbnXhKriO8Z036q92Qc1+N87SI38nkGa0ABH9CN83H
mQqt4fB7UdHzuIRe/me2PGhIq5ZBzj6h3BpoPGzEP+x3l9YmK8t/1cN0pqI+dQwY
dgfGjackLu/2qH80MCF7IyQaseZUOJyKrCLtSD/Iixv/hzDEUPfOCjFDgTpzf3cw
ta8+oE4wHCo1iI1/4TlPkwmXx4qSXtmw4aQPz7IDQvECgYEA8KNThCO2gsC2I9PQ
DM/8Cw0O983WCDY+oi+7JPiNAJwv5DYBqEZB1QYdj06YD16XlC/HAZMsMku1na2T
N0driwenQQWzoev3g2S7gRDoS/FCJSI3jJ+kjgtaA7Qmzlgk1TxODN+G1H91HW7t
0l7VnL27IWyYo2qRRK3jzxqUiPUCgYEAx0oQs2reBQGMVZnApD1jeq7n4MvNLcPv
t8b/eU9iUv6Y4Mj0Suo/AU8lYZXm8ubbqAlwz2VSVunD2tOplHyMUrtCtObAfVDU
AhCndKaA9gApgfb3xw1IKbuQ1u4IF1FJl3VtumfQn//LiH1B3rXhcdyo3/vIttEk
48RakUKClU8CgYEA5SzWJEaT7CkrrYwHuCEGjNYG3CYd8Kq0KtTQZUnxIFHh8YmA
TVhPT/9LTsJ1gOCsAgHiStmfE8UUDbhFQYcGRhLvw/SKpPWVSgn/FNZdZPZ8dluX
k+TGRQNQiuagQ1x2E9ohWrJB4drhtEHrhulaDiW+1cxZGQNHeeJgMA6au1UCgYBn
k3FzXX/O8b9SuNCoiRozS/8UJGtxUjb5sI4LFzw3HLWoNtgBttqLLHjgf/Mo8Sty
YmjtcL/iIfqneOYQ/oQR8h1EYUf8ZSqo2VdAbxyCF6rx+14zH0B4ys3CWK6DECP7
4WkHhlygBtQpHKqV2h6nLWIq1Z2GTtOarUwmBRhMbQKBgQCwcULRTrcA6p1DBYyP
I7MNo1p3iwajZUoAkov0Z/TpWTIGqEQvwXJ6xFOqeGxY1dh1d/mB9YWoqQszKm5C
CJah+zFZtCpJpsyxoqnUZHhI+/nyuTxbOQNJXHlU4FFvKR0FxVM0y5H2GJfnAIGx
pGYTNqY0/qpb3mxz32lFCRNIxw==
-----END PRIVATE KEY-----`.trim();

const Message = () => {
  const dispatch = useAppDispatch();
  const {message} = useAppSelector(state => state.message);
  const [flip, setFlip] = useState(false);
  // const timezoneee = moment.tz.guess();
  // const normalizedTimezone = normalizeTimezone(timezoneee); // Use the mapping function
  const {width, height} = Dimensions.get('window');
  const [deviceUniqueId, setDeviceUniqueId] = useState('');
  const [deviceModel, setDeviceModel] = useState('');
  const [deviceSysVersion, setDeviceSysVersion] = useState('');
  const [deviceIP, setDeviceIP] = useState('');
  const [deviceTimeZone, setDeviceTimeZone] = useState('');
  const [deviceType, setDeviceType] = useState('');
  const [deviceLocale, setDeviceLocale] = useState('');
  const [deviceName, setDeviceName] = useState('');
  const [publicIP, setPublicIP] = useState('');
  const [pixelRatio, setPixelRatio] = useState(0);

  const jwtGenerator = new JWTGenerator(privateKeyPem, externalId);
  function generateAndPrintToken() {
    try {
      const token = jwtGenerator.generateToken(
        'SDK_APPLICATION_ROLE',
        'jwt_client',
        'https://platform.brightinsight.com/am/oauth2/access_token',
        300, // 5 mins expiration
      );
      console.log('Generated token via JSRSAsign:', token);
      //setTokenJSRSAsign(token);
    } catch (error) {
      console.error('Failed to generate token via JSRSAsign:', error);
    }
  }

  generateAndPrintToken();

  // async function generatorJwtTokenJose() {
  //   try {
  //     const payload = {
  //       sub: 'SDK_APPLICATION_ROLE',
  //       iss: 'jwt_client',
  //       aud: 'https://platform.brightinsight.com/am/oauth2/access_token',
  //       exp: 300, // 5 mins expiration
  //     };
  //     const jwt = await generateJwtTokenJose(
  //       privateKeyPem,
  //       externalId,
  //       payload.sub,
  //       payload.iss,
  //       payload.aud,
  //       payload.exp,
  //     );
  //     console.log('Generated JWT generatorJwtTokenJose:', jwt);
  //   } catch (error) {
  //     console.error('Failed to generate token generatorJwtTokenJose:', error);
  //   }
  // }

  // generatorJwtTokenJose();

  const getDeviceInfo = useCallback(async () => {
    const dvcID = await DeviceInfo.getUniqueId();
    const dvcMd = await DeviceInfo.getModel();
    const sv = await DeviceInfo.getSystemVersion();
    const ipAdd = await DeviceInfo.getIpAddress();
    const dType = await DeviceInfo.getDeviceType();
    const name = await DeviceInfo.getDeviceName();
    const locale = Intl.DateTimeFormat().resolvedOptions().locale;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const response = await fetch('https://api64.ipify.org?format=json');
    const publicIPAdd = await response.json();
    const pRatio = PixelRatio.get();
    setDeviceUniqueId(dvcID);
    setDeviceModel(dvcMd);
    setDeviceSysVersion(sv);
    setDeviceIP(ipAdd);
    setDeviceType(dType);
    setDeviceTimeZone(timezone);
    setDeviceLocale(locale);
    setDeviceName(name);
    setPublicIP(publicIPAdd.ip);
    setPixelRatio(pRatio);
  }, []);

  useEffect(() => {
    getDeviceInfo();
  }, [getDeviceInfo]);

  const handlePress = () => {
    if (!flip) {
      dispatch(setMessage('Now we are ready !!!'));
      setFlip(true);
    } else {
      dispatch(setMessage('Hello Saturn !!!'));
      setFlip(false);
    }
  };

  return (
    <View
      // eslint-disable-next-line react-native/no-inline-styles
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        marginTop: 100,
        marginBottom: 50,
      }}>
      {/* <Text>{message}</Text>
      <Button title={'Set Message'} onPress={handlePress} /> */}
      {/* <Text>deviceUniqueId (not common): {deviceUniqueId}</Text> */}
      <Text>deviceModel: {deviceModel}</Text>
      <Text>deviceWidth: {width}</Text>
      <Text>deviceHeight: {height}</Text>
      <Text>pixelRatio: {pixelRatio}</Text>
      <Text>deviceSysVersion: {deviceSysVersion}</Text>
      {/* <Text>deviceIP: {deviceIP}</Text> */}
      <Text>deviceType: {deviceType}</Text>
      <Text>deviceTimeZone: {deviceTimeZone}</Text>
      <Text>deviceLocale: {deviceLocale}</Text>publicIP
      <Text>deviceName: {deviceName}</Text>
      <Text>publicIP: {publicIP}</Text>
    </View>
  );
};

export default Message;
