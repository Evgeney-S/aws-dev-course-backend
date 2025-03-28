import { APIGatewayTokenAuthorizerEvent, APIGatewayAuthorizerResult } from 'aws-lambda';

export const handler = async (event: APIGatewayTokenAuthorizerEvent): Promise<APIGatewayAuthorizerResult> => {
    console.log('Event: ', JSON.stringify(event));

    if (!event.authorizationToken) {
        throw new Error('Unauthorized'); // Return 401
    }

    try {
        const encodedCreds = event.authorizationToken.split(' ')[1];
        const plainCreds = Buffer.from(encodedCreds, 'base64').toString().split('=');
        const username = plainCreds[0];
        const password = plainCreds[1];

        console.log(`username: ${username}, password: ${password}`);

        const storedUserPassword = process.env[username];
        const effect = (!storedUserPassword || storedUserPassword !== password) ? 'Deny' : 'Allow';

        return generatePolicy(encodedCreds, event.methodArn, effect);

    } catch (error) {
        throw new Error('Forbidden'); // Return 403
    }
};

const generatePolicy = (principalId: string, resource: string, effect: 'Allow' | 'Deny'): APIGatewayAuthorizerResult => {
    return {
        principalId,
        policyDocument: {
            Version: '2012-10-17',
            Statement: [
                {
                    Action: 'execute-api:Invoke',
                    Effect: effect,
                    Resource: resource
                }
            ]
        }
    };
};
