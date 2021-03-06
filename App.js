import React from 'react';
import { StackNavigator } from 'react-navigation';
import { routesConfig } from './src/screens';
import Amplify, { withAuthenticator } from 'aws-amplify-react-native';
import awsconfig from './src/aws-exports';
import AWSAppSyncClient from 'aws-appsync';
import { Rehydrated } from 'aws-appsync-react';
import { ApolloProvider } from 'react-apollo';
import appsyncConfig from './src/AppSync';

const appsyncClient = new AWSAppSyncClient({
  url: appsyncConfig.graphqlEndpoint,
  region: appsyncConfig.region,
  auth: { type: appsyncConfig.authenticationType, apiKey: appsyncConfig.apiKey }
});

Amplify.configure(awsconfig);

const App = () => {
  const Navigator = StackNavigator(routesConfig, {
    initialRouteName: 'list',
    initialRouteParams: {
      username: ""
    }
  });

  return (
    <ApolloProvider client={appsyncClient}>
      <Rehydrated>
        <Navigator/>
      </Rehydrated>
    </ApolloProvider>
  );
};

export default withAuthenticator(App);
