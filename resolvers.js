const { GraphQLClient } = require('graphql-request')
const fs = require('fs')
const bcrypt = require('bcryptjs')
const jwt = require('jsonwebtoken')

require('dotenv').config()

const graphql = new GraphQLClient(process.env.ENDPOINT, {
  headers: {
    'X-Hasura-Admin-Secret': process.env.HASURA_ADMIN_SECRET
  }
})

const LOGIN = `
  query($email: String) {
    user(where:{email: {_eq: $email}}) { id password is_team_member is_manager }
  }
`

const DEVICELOGIN = `
  query($email: String){
    device(where: {email: {_eq: $email}}){
      id
      email
      password
    }
  }
`;

const SIGNUP = `
  mutation($name: String, $email: String, $password: String){
    insert_user( objects:{ name: $name email: $email password: $password } ){ returning { id } } }
`;

const ME = `
  query($id: uuid) {
    user(where:{id: {_eq: $id}}) { email, favorite_order { id } }
  }
`



const signOptions = {
  issuer: "Restaurant Example Co", //* Company Name That Issues The Token
  // audience: "",  ///* URL of website
  //algorithm: "RS256", //* Allows for Pem keys to be read properly,
  expiresIn: '24hr' //* Token expiration
}

const resolvers = {
  Query: {
    me: async (_, args, req) => {
      if (req.userId) {
        const user = await graphql.request(ME, { id: req.userId }).then(data => {
          return data.user[0]
        })
        return { ...user }
      } else {
        throw new Error('Not logged in.')
      }
    }
  },
  Mutation: {
    signup: async (_, { email, password, name }) => {
      const hashedPassword = await bcrypt.hash(password, 10)

      const user = await graphql.request(SIGNUP, { email, password: hashedPassword, name }).then(data => {
        return data.insert_user.returning[0]
      })

      const token = jwt.sign({
        userId: user.id,
        'https://hasura.io/jwt/claims': {
          'x-hasura-user-id': user.id,
          'x-hasura-default-role': 'user',
          'x-hasura-allowed-roles': ['user']
        },
      }, process.env.PRIVATE_KEY, signOptions)

      return { token }
    },
    deviceLogin: async (_, { email, password }, req) => {
      
      const device = await graphql.request(DEVICELOGIN, { email })
        .then((data) => {
          return data.device[0];
        });

      if (!device) throw new Error("No such device found.");

      const valid = await bcrypt.compare(password, device.password);

      if (valid) {
        const token = jwt.sign(
          {
            deviceId: device.id,
            "https://hasura.io/jwt/claims": {
              "x-hasura-user-id": device.id,
              "x-hasura-default-role": "device",
              "x-hasura-allowed-roles": ["device"],
            },
          },
          process.env.PRIVATE_KEY,
          signOptions
        );

        return { token };
      } else {
        throw new Error("Invalid password.");
      }

    },
    login: async (_, { email, password }) => {
      const user = await graphql.request(LOGIN, { email }).then(data => {
        return data.user[0]
      })

      if (!user) throw new Error('No such user found.')

      const valid = await bcrypt.compare(password, user.password)

      if (valid) {

        let role
        let roles 

        if(user.is_manager){
          role = 'manager'
          roles = ['manager']
        }else{
          role = user.is_team_member ? 'team_member' : 'user';
          roles = [role];
        }

        const token = jwt.sign({
          userId: user.id,
          'https://hasura.io/jwt/claims': {
            'x-hasura-user-id': user.id,
            'x-hasura-default-role': role,
            'x-hasura-allowed-roles': roles
          }
        }, process.env.PRIVATE_KEY, signOptions)

        return { token }
      } else {
        throw new Error('Invalid password.')
      }
    }
  }
}

module.exports = { resolvers }
