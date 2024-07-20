import { useAuth, SignInButton, SignOutButton } from '@clerk/nextjs';
import { useUser } from '@clerk/nextjs';
import React, { useState } from 'react';
import { useRouter } from 'next/router';
import axios from 'axios';
import {
  GlobalStyle,
  Container,
  Title,
  Form,
  FormGroup,
  FormContainer,
  Label,
  Input,
  Select,
  Button,
  Subtitle,
  AlertBox
} from '../components/StyledComponents';

export default function Home() {
  const { isLoaded, userId } = useAuth();
  const { user } = useUser();
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false); // New state for loading
  const [formData, setFormData] = useState({
    amazonEmail: '',
    amazonPassword: '',
    firstName: '',
    lastName: '',
    middleInitial: '',
    streetAddress: '',
    city: '',
    state: '',
    zipCode: '',
    areaCode: '',
    phoneNumber: '',
    ssnOrHEQID: '',
    bankName: '',
    bankCity: '',
    bankState: '',
    routingNumber: '',
    accountNumber: '',
    accountType: 'checking',
    companyName: '',
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prevState => ({
      ...prevState,
      [name]: value
    }));
  };

  const handleCheckEligibility = async (e) => {
    e.preventDefault();
    setIsLoading(true); // Set loading state to true
    try {
      const response = await axios.post('/api/check-eligibility', {
        year: new Date().getFullYear().toString(),  // Use current year
        email: formData.amazonEmail,
        password: formData.amazonPassword,
        firstName: user.firstName,
        lastName: user.lastName,
      });

      localStorage.setItem('userFormData', JSON.stringify({
        ...formData,
        firstName: user.firstName,
        lastName: user.lastName,
      }));

      router.push({
        pathname: '/results',
        query: {
          eligibleOrders: JSON.stringify(response.data),
          amazonEmail: formData.amazonEmail,
          amazonPassword: formData.amazonPassword,
          firstName: user.firstName,
          lastName: user.lastName,
        }
      });
    } catch (error) {
      console.error('Error checking eligibility:', error);
    } finally {
        setIsLoading(false); // Set loading state to false
      }
  };

  if (!isLoaded) {
    return <Container>Loading...</Container>;
  }

  return (
    <>
      <GlobalStyle />
      <Container>
        <Title>Amazon HSA + FSA Order Checker</Title>
        {userId ? (
          <>
            <center><p style={{ color: '#b3b3b3' }}>You are signed in!</p></center>
            <FormContainer>
              <Form onSubmit={handleCheckEligibility}>
                <Subtitle>Check Eligibility</Subtitle>
                <FormGroup>
                  <Label htmlFor="amazonEmail">Amazon Email:</Label>
                  <Input id="amazonEmail" type="email" name="amazonEmail" value={formData.amazonEmail} onChange={handleInputChange} required />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="amazonPassword">Amazon Password:</Label>
                  <Input id="amazonPassword" type="password" name="amazonPassword" value={formData.amazonPassword} onChange={handleInputChange} required />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="firstName">First Name:</Label>
                  <Input id="firstName" type="text" name="firstName" value={formData.firstName} onChange={handleInputChange} required />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="lastName">Last Name:</Label>
                  <Input id="lastName" type="text" name="lastName" value={formData.lastName} onChange={handleInputChange} required />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="middleInitial">Middle Initial:</Label>
                  <Input id="middleInitial" type="text" name="middleInitial" value={formData.middleInitial} onChange={handleInputChange} />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="streetAddress">Street Address:</Label>
                  <Input id="streetAddress" type="text" name="streetAddress" value={formData.streetAddress} onChange={handleInputChange} required />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="city">City:</Label>
                  <Input id="city" type="text" name="city" value={formData.city} onChange={handleInputChange} required />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="state">State:</Label>
                  <Input id="state" type="text" name="state" value={formData.state} onChange={handleInputChange} required />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="zipCode">Zip Code:</Label>
                  <Input id="zipCode" type="text" name="zipCode" value={formData.zipCode} onChange={handleInputChange} required />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="areaCode">Area Code:</Label>
                  <Input id="areaCode" type="text" name="areaCode" value={formData.areaCode} onChange={handleInputChange} required />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="phoneNumber">Phone Number:</Label>
                  <Input id="phoneNumber" type="tel" name="phoneNumber" value={formData.phoneNumber} onChange={handleInputChange} required />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="companyName">Company Name:</Label>
                  <Input id="companyName" type="text" name="companyName" value={formData.companyName} onChange={handleInputChange} required />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="ssnOrHEQID">SSN or HEQ ID:</Label>
                  <Input id="ssnOrHEQID" type="text" name="ssnOrHEQID" value={formData.ssnOrHEQID} onChange={handleInputChange} required />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="bankName">Bank Name:</Label>
                  <Input id="bankName" type="text" name="bankName" value={formData.bankName} onChange={handleInputChange} required />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="bankCity">Bank City:</Label>
                  <Input id="bankCity" type="text" name="bankCity" value={formData.bankCity} onChange={handleInputChange} required />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="bankState">Bank State:</Label>
                  <Input id="bankState" type="text" name="bankState" value={formData.bankState} onChange={handleInputChange} required />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="routingNumber">Routing Number:</Label>
                  <Input id="routingNumber" type="text" name="routingNumber" value={formData.routingNumber} onChange={handleInputChange} required />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="accountNumber">Account Number:</Label>
                  <Input id="accountNumber" type="text" name="accountNumber" value={formData.accountNumber} onChange={handleInputChange} required />
                </FormGroup>
                <FormGroup>
                  <Label htmlFor="accountType">Account Type:</Label>
                  <Select id="accountType" name="accountType" value={formData.accountType} onChange={handleInputChange} required>
                    <option value="checking">Checking</option>
                    <option value="savings">Savings</option>
                  </Select>
                </FormGroup>
                <Button type="submit" disabled={isLoading}>
                  {isLoading ? 'Checking...' : 'Check Eligibility'}
                </Button>
              </Form>
            </FormContainer>
            <SignOutButton>
              <Button>Sign Out</Button>
            </SignOutButton>
          </>
        ) : (
          <>
            <center><p style={{ color: '#b3b3b3' }}>Please sign in to continue.</p></center>
            <SignInButton mode="modal">
              <Button>Sign In</Button>
            </SignInButton>
          </>
        )}
      </Container>
    </>
  );
}
