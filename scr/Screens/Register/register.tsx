import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Image,
  ImageBackground,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableWithoutFeedback,
  Keyboard,
  Alert,
  Linking,
} from 'react-native';
import {useDispatch, useSelector} from 'react-redux';
import {
  registerRequest,
  resetRegisterResponse,
} from '../../redux/slices/authSlice';
import Colors from '../../Helper/Colors';
import {wp} from '../../Helper/Responsive';
import {Fonts} from '../../Helper/Fonts';
import Header from '../../Components/Header';
import { navigationRef } from '../../navigationRef';
import Config from 'react-native-config';

const Register = ({navigation}: {navigation: any}) => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [errorMessage, setErrorMessages] = useState<any>({
    firstNameError: '',
    lastNameError: '',
    emailError: '',
    phoneError: '',
    passwordError: '',
  });

  const dispatch = useDispatch();
  const {loading, registerResponse} = useSelector((state: any) => state.auth);
  useEffect(() => {
    if (registerResponse) {
      if (registerResponse.success) {
        Alert.alert('Success', registerResponse.message, [
          {
            text: 'OK',
            onPress: () => {
              dispatch(resetRegisterResponse());
              navigation.navigate('Login');
            },
          },
        ]);
      } else if (registerResponse.error) {
        // Check if error is an object with message property
        const errorMessage =
          typeof registerResponse.error === 'object'
            ? registerResponse.error.message || 'Registration failed'
            : registerResponse.error;

        Alert.alert('Error', errorMessage);
      }
    }
  }, [registerResponse]);

  const handleRegister = () => {
    const Regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!firstName) {
      setErrorMessages((prev: any) => ({
        ...prev,
        firstNameError: 'Please enter your name',
      }));
    } else if (!lastName) {
      setErrorMessages((prev: any) => ({
        ...prev,
        lastNameError: 'Please enter your last name',
      }));
    } else if (!email) {
      setErrorMessages((prev: any) => ({
        ...prev,
        emailError: 'Please enter your email',
      }));
    } else if (!Regex.test(email)) {
      setErrorMessages((prev: any) => ({
        ...prev,
        emailError: 'Please enter a valid email',
      }));
    } else if (!phone.trim()) {
      setErrorMessages((prev: any) => ({
        ...prev,
        phoneError: 'Please enter your phone number',
      }));
    } else if (!password) {
      setErrorMessages((prev: any) => ({
        ...prev,
        passwordError: 'Please enter your password',
      }));
    } else if (password.length < 6) {
      setErrorMessages((prev: any) => ({
        ...prev,
        passwordError: 'Password must be at least 6 characters',
      }));
    } else {
      apiCall();
    }
  };
  const apiCall = () => {
    const userData = {
      first_name: firstName,
      last_name: lastName,
      email,
      phone: phone.trim(),
      password,
    };
    console.log('@USER register', userData);
    dispatch(registerRequest(userData));
  };

  return (
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.container}>

        <TouchableWithoutFeedback onPress={Keyboard.dismiss}>
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            {/* <TouchableOpacity onPress={() => navigation.goBack()}>
              <Image
                source={require('../../assets/arrow.png')}
                style={styles.icon}
              />
            </TouchableOpacity> */}
            <View style={styles.form}>
              <Text style={styles.title}>Register</Text>
              <Text style={styles.subtitle}>
                Create an account to continue!
              </Text>

              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={styles.input}
                placeholder="First Name"
                value={firstName}
                onChangeText={text => {
                  setErrorMessages((prevState: any) => ({
                    ...prevState,
                    firstNameError: null,
                  }));
                  setFirstName(text);
                }}
                autoCapitalize="words"
                placeholderTextColor="#9E9E9E"
              />
              {errorMessage.firstNameError && (
                <Text style={styles.errorText}>
                  {errorMessage.firstNameError}
                </Text>
              )}
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={styles.input}
                placeholder="Last Name"
                value={lastName}
                onChangeText={text => {
                  setErrorMessages((prevState: any) => ({
                    ...prevState,
                    lastNameError: null,
                  }));
                  setLastName(text);
                }}
                autoCapitalize="words"
                placeholderTextColor="#9E9E9E"
              />
              {errorMessage.lastNameError && (
                <Text style={styles.errorText}>
                  {errorMessage.lastNameError}
                </Text>
              )}
              <Text style={styles.label}>Email Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Email Address"
                value={email}
                onChangeText={text => {
                  setErrorMessages((prevState: any) => ({
                    ...prevState,
                    emailError: null,
                  }));
                  setEmail(text);
                }}
                keyboardType="email-address"
                autoCapitalize="none"
                placeholderTextColor="#9E9E9E"
              />
              {errorMessage.emailError && (
                <Text style={styles.errorText}>{errorMessage.emailError}</Text>
              )}
              <Text style={styles.label}>Phone Number</Text>
              <View style={styles.phoneContainer}>
                <TextInput
                  style={[styles.phoneInput, {borderLeftWidth: 0}]}
                  placeholder="07123 456789"
                  value={phone}
                  onChangeText={text => {
                    setErrorMessages((prevState: any) => ({
                      ...prevState,
                      phoneError: null,
                    }));
                    setPhone(text);
                  }}
                  keyboardType="phone-pad"
                  placeholderTextColor="#9E9E9E"
                />
              </View>
              {errorMessage.phoneError && (
                <Text style={styles.errorText}>{errorMessage.phoneError}</Text>
              )}
              <Text style={styles.label}>Password</Text>
              <View style={styles.passwordContainer}>
                <TextInput
                  style={styles.passwordInput}
                  placeholder="Password"
                  value={password}
                  onChangeText={text => {
                    setErrorMessages((prevState: any) => ({
                      ...prevState,
                      passwordError: null,
                    }));
                    setPassword(text);
                  }}
                  secureTextEntry={!showPassword}
                  placeholderTextColor="#9E9E9E"
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}>
                  <Image
                    source={
                      showPassword
                        ? require('../../assets/visible.png')
                        : require('../../assets/NotVisible.png')
                    }
                    style={{
                      width: showPassword ? wp(6) : wp(5),
                      height: showPassword ? wp(6) : wp(5),
                    }}
                    tintColor={Colors.eyeIcon}
                    resizeMode="contain"
                  />
                </TouchableOpacity>
              </View>
              {errorMessage.passwordError && (
                <Text style={styles.errorText}>
                  {errorMessage.passwordError}
                </Text>
              )}
              <View
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  marginTop: 15,
                }}>
                <Text
                  style={{color: Colors.primary, textDecorationLine: 'underline'}}
                  onPress={() =>
                    Linking.openURL(
                      `${Config.API_BASE_URL}/privacy-policy`,
                    )
                  }>
                  Privacy Policy
                </Text>
              </View>

              {/* Register Button */}
              <TouchableOpacity
                style={[styles.button, loading && styles.disabledButton]}
                onPress={handleRegister}
                disabled={loading}>
                <Text style={styles.buttonText}>
                  {loading ? 'Please wait...' : 'Register'}
                </Text>
              </TouchableOpacity>
              {/* Login Redirect */}
              <TouchableOpacity
                onPress={() => navigation.navigate('Login')}
                style={styles.link}>
                <Text style={styles.linkText}>
                  Already have an account?{' '}
                  <Text style={styles.linkBold}>Log in</Text>
                </Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  background: {
    flex: 1,
    justifyContent: 'center',
  },
  logo: {
    width: 40,
    height: 40,
    alignSelf: 'center',
    marginBottom: 20,
  },

  container: {
    flex: 1,
    justifyContent: 'center',
    paddingTop: 30,
    backgroundColor: Colors.white,
  },
  scrollContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  form: {
    backgroundColor: Colors.white,
  },
  title: {
    fontSize: 26,
    fontFamily: Fonts.bold,
    color: Colors.primary,
    marginVertical: 15,
  },
  subtitle: {
    fontSize: 14,
    fontFamily: Fonts.regular,
    color: '#6C7278',
    marginBottom: 10,
  },
  label: {
    fontSize: 14,
    color: '#6B7280',
    marginVertical: 5,
    fontFamily: Fonts.semiBold,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 10,
    marginBottom: 5,
    backgroundColor: '#FFF',
    fontSize: 16,
    color: '#333',
    height: 55,
  },
  icon: {
    width: 40,
    height: 40,
  },
  passwordContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    paddingHorizontal: 10,
    backgroundColor: '#FFF',
    height: 55,
  },
  passwordInput: {
    flex: 1,
    height: 55,
  },
  eyeIcon: {
    marginLeft: 10,
  },
  button: {
    backgroundColor: Colors.primary,
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 20,
    height: 55,
    justifyContent: 'center',
  },
  buttonText: {
    color: '#FFF',
    fontSize: 16,
    fontFamily: Fonts.bold,
  },
  link: {
    marginTop: 20,
    alignItems: 'center',
  },
  linkText: {
    color: '#6C7278',
  },
  linkBold: {
    fontFamily: Fonts.bold,
    color: Colors.primary,
  },
  errorText: {
    color: 'red',
    textAlign: 'left',
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingHorizontal: 5,
    backgroundColor: '#FFF',
    marginBottom: 5,
    height: 55,
  },
  countryPicker: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingRight: 10,
  },
  callingCode: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  phoneInput: {
    flex: 1,
    borderLeftWidth: 0.3,
    padding: 10,
    height: 55,
    borderColor: '#E0E0E0',
  },
});

export default Register;
