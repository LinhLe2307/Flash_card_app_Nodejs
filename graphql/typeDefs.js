const { gql } = require('apollo-server-express');
const client = require('../postgresql/db')

const typeDefs = gql`
  scalar Upload
  scalar JSON
  
  input ImageInput {
    url: String
    file: Upload
  }

  type Query {
    getUsers: [User!]!
    getUserDetail(userId: ID!): User
    getCountries: [Country!]!
    getLanguages: [Language!]!
    getCardsByUserId(
      userId: ID!
    ): User
    getCardById(cardId: ID!): JSON!
  }

  type Mutation {
    loginAuth(email: String!, password: String!): LoginUser
    signUpAuth(
      firstName: String!
      lastName: String!
      image: Upload!
      aboutMe: String
      country: String!
      password: String!
      email: String!
      phone: String
      language: String
      x: String
      linkedIn: String
      instagram: String
      github: String
      website: String
    ): LoginUser
    updateUser(
      userId: ID!
      firstName: String!
      lastName: String!
      image: ImageInput!
      aboutMe: String
      country: String!
      email: String!
      phone: String
      language: String
      x: String
      linkedIn: String
      instagram: String
      github: String
      website: String
    ): User
    deleteUser(userId: ID!): String!
    createCard(input: JSON!): JSON!
    updateCard(input: JSON!): JSON!
    deleteCard(
      cardId: ID!
      userId: ID!
    ): String!
  }

  type LoginUser {
    userId: ID!
    email: String!
    token: String!
  }

  type User {
    id: ID!
    firstName: String!
    lastName: String!
    aboutMe: String
    country: String!
    email: String!
    image: String!
    phone: String
    language: String!
    x: String
    linkedIn: String
    instagram: String
    github: String
    website: String
    cards: [Card!]
  }

  type Card {
    id: ID!
    title: String!
    description: String!
    creator: User!
    tags: [Tag]
    subcards: [Subcard]
  }

  type Subcard {
    id: ID!
    term: String!
    definition: String!
    image: String
  }

  type Language {
    id: ID!
    name: String!
  }

  type Country {
    id: ID!
    country: String!
  }

  type Tag {
    id: ID!
    name: String
    cards: [Card]
  }
`

module.exports = typeDefs