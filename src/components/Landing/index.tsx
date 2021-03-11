import React, { useEffect, useState, forwardRef, DOMElement } from "react";
import { Box, Button, Card, IconBase, IconLedger, Input, InputLabelBase, Glyph, Text, Title, Header, HeaderGlyph } from "@glif/react-components";
import { useRouter } from "next/router";
import axios from "axios";
import styled from 'styled-components'
import { useIdentityProvider, useJwt } from "../../contexts";
import { isValidEmail } from "../../utils";

const Form = styled.form`
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-grow: 1;
  width: 100%;
`
const Link: any = styled.a`
  text-decoration: none;
  color: black;
`

const onSubmit = async (e: any) => {
  return e
}

const onClick = async (e: any) => {
  return e
}

export default function Landing() {
  return (
    <>
      <Box
        position="relative"
        display="flex"
        flexWrap="wrap"
        minHeight="90vh"
        alignItems="center"
        justifyContent="space-evenly"
        flexGrow="1"
        p={[2, 3, 5]}
      >
        <Box
          display="flex"
          maxWidth={13}
          width={["100%", "100%", "40%"]}
          flexDirection="column"
          alignItems="flex-start"
          alignContent="center"
          mb={4}
        >
          <HeaderGlyph
            alt="Source: https://unsplash.com/photos/g2Zf3hJyYAc"
            text="Identity"
            imageUrl="/imgverify.png"
            color="white"
            fill="white"
          />
          <Box
            display="flex"
            flexDirection="column"
            mt={[2, 4, 4]}
            alignSelf="center"
            textAlign="left"
          >
            <Header lineHeight={1}>Login to the dweb</Header>
            <Title mt={3} lineHeight="140%" color="core.darkgray">
              An interface to create and control your decentralized identities.
              Sign up with email or connect a wallet. Rolling out in select apps.
            </Title>
          </Box>
          <Card
            display='flex'
            flexDirection='column'
            justifyContent='space-between'
            alignContent='space-between'
            role='button'
            css={`
              cursor: pointer;
              transition: 0.13s ease-in-out;
              &:hover {
                transform: scale(1.05);
              }
            `}
            height={7}
            my={4}
            p={2}
          >
            <Link href="https://slate.host">
              <Box display='flex' alignItems='center' textAlign='center' padding='5px 10px'>
                <svg height="36px" fill="none" viewBox="0 0 70 79" xmlns="http://www.w3.org/2000/svg"><g clip-rule="evenodd" fill="currentColor" fill-rule="evenodd"><path d="m54.9707 59.4117v7.0358l13.074-7.5436v-21.3229l-34.2575-19.7804v7.0358l28.1687 16.2625v14.2741zm6.9852-36.1851v8.0481l6.0888 3.5251v-15.0977l-34.0983-19.6808598-18.4574 10.6455598v21.4948l30.9779 17.8671v14.2923l-12.5205 7.2229-27.85767-16.0805v-8.048l-6.08873-3.5252v15.0977l33.9464 19.6051 18.6093-10.7512v-21.3145l-30.978-17.8913v-14.4559l12.3687-7.14023zm-48.8819-4.1314v-7.0403l-13.074 7.5714v21.4733l34.1056 19.6917v-7.038l-28.01687-16.1714v-14.4314z"></path></g></svg>
                <Text ml={4} my={0}>
                  Find Glif in Slate today
                </Text>
              </Box>
            </Link>
          </Card>
        </Box>
        <Box
          position='relative'
          display='flex'
          maxWidth={13}
          width={['100%', '100%', '50%']}
          flexDirection='column'
          alignItems='flex-start'
          alignContent='center'
          backgroundColor='#0a0a0a'
          borderRadius={3}
          border={1}
          boxShadow={2}
        >
          <HeaderGlyph
            alt='Source: https://www.nontemporary.com/post/190437968500'
            text='Dev'
            imageUrl='/imgvault.png'
            color='core.white'
            fill='#fff'
            width='100%'
            imageOpacity='0.9'
          />

          <Box
            display='flex'
            flexDirection='column'
            alignSelf='center'
            textAlign='left'
            p={4}
          >
            <Title fontSize={5} color='core.white' textAlign="center">
              Want to build with Glif Identity?
            </Title>
            <Box
              display='flex'
              flexDirection='column'
              p={3}
              my={3}
              minHeight={10}
              width='100%'
              maxWidth={13}
              alignItems='center'
              justifyContent='flex-start'
              borderRadius={2}
            >
              <Box
                display='flex'
                flexDirection='column'
                alignItems='center'
                mt={3}
              >
                <Text
                  color='core.lightgray'
                  textAlign='center'
                  p={0}
                  mt={0}
                  maxWidth={11}
                >
                  Get easy authentication with decentralized identities in your app.
                </Text>
                <Link href="mailto:squad@infinitescroll.org">
                  <Card
                    display='flex'
                    flexDirection='column'
                    justifyContent='space-between'
                    alignContent='space-between'
                    backgroundColor='background.screen'
                    height={7}
                    my={3}
                    p={2}
                    css={`
                      cursor: pointer;
                      transition: 0.13s ease-in-out;
                      &:hover {
                        transform: scale(1.05);
                      }
                    `}
                    role='button'
                  >
                    <Box display='flex' alignItems='center' textAlign='center' textDecoration='none'>
                      <Glyph
                        acronym={'Em'}
                        border={0}
                      />
                      <Text ml={4} my={0}>
                        Email Us
                      </Text>
                    </Box>
                  </Card>
                </Link>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
}
