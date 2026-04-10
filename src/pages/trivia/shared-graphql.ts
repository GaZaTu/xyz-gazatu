import fetchGraphQL, { gql } from "../../lib/fetchGraphQL"
import { Mutation } from "../../lib/schema.gql"

export const verifyTriviaCategories = async (ids: string[]) => {
  await fetchGraphQL<Mutation>({
    query: gql`
      mutation ($ids: [String!]!) {
        verifyTriviaCategories(ids: $ids)
      }
    `,
    variables: { ids },
  })
}

export const removeTriviaCategories = async (ids: string[]) => {
  await fetchGraphQL<Mutation>({
    query: gql`
      mutation ($ids: [String!]!) {
        removeTriviaCategories(ids: $ids)
      }
    `,
    variables: { ids },
  })
}

export const verifyTriviaQuestions = async (ids: string[]) => {
  await fetchGraphQL<Mutation>({
    query: gql`
      mutation ($ids: [String!]!) {
        verifyTriviaQuestions(ids: $ids)
      }
    `,
    variables: { ids },
  })
}

export const removeTriviaQuestions = async (ids: string[]) => {
  await fetchGraphQL<Mutation>({
    query: gql`
      mutation ($ids: [String!]!) {
        removeTriviaQuestions(ids: $ids)
      }
    `,
    variables: { ids },
  })
}

export const removeTriviaReports = async (ids: string[]) => {
  await fetchGraphQL<Mutation>({
    query: gql`
      mutation ($ids: [String!]!) {
        removeTriviaReports(ids: $ids)
      }
    `,
    variables: { ids },
  })
}
