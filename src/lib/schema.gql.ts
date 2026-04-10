export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
export type MakeEmpty<T extends { [key: string]: unknown }, K extends keyof T> = { [_ in K]?: never };
export type Incremental<T> = T | { [P in keyof T]?: P extends ' $fragmentName' | '__typename' ? T[P] : never };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: { input: string; output: string; }
  String: { input: string; output: string; }
  Boolean: { input: boolean; output: boolean; }
  Int: { input: number; output: number; }
  Float: { input: number; output: number; }
  File: { input: any; output: any; }
  Void: { input: any; output: any; }
  Unknown: { input: any; output: any; }
};

export type Query = {
  __typename?: 'Query';
  /** public */
  findBlogEntry?: Maybe<BlogEntry>;
  /** public */
  listBlogEntries: BlogEntryListConnection;
  /** public */
  serverConfig: ServerConfig;
  /** requires: admin */
  serverLoad: Array<ServerLoadResultObject>;
  /** requires: admin */
  listAuditLog: AuditLogListConnection;
  /** public */
  findTriviaCategory?: Maybe<TriviaCategory>;
  /** public */
  listTriviaCategories: TriviaCategoryListConnection;
  /** public */
  findTriviaQuestion?: Maybe<TriviaQuestion>;
  /** public */
  listTriviaQuestions: TriviaQuestionListConnection;
  /** public */
  findTriviaReport?: Maybe<TriviaReport>;
  /** public */
  listTriviaReports: TriviaReportListConnection;
  /** public */
  getTriviaCounts: TriviaCounts;
  /** public */
  listUserRoles: Array<UserRole>;
  /** requires: admin or current_user */
  findUser?: Maybe<User>;
  /** requires: admin */
  listUsers: UserListConnection;
  /** requires: admin or current_user */
  listPasskeys: Array<UserPasskey>;
  /** requires: admin */
  listPasswordResetRequests: Array<UserPasswordResetRequest>;
};


export type QueryFindBlogEntryArgs = {
  id: Scalars['String']['input'];
};


export type QueryListBlogEntriesArgs = {
  args?: InputMaybe<ListBlogEntriesArgs>;
};


export type QueryListAuditLogArgs = {
  args?: InputMaybe<ListAuditLogArgs>;
};


export type QueryFindTriviaCategoryArgs = {
  id: Scalars['String']['input'];
};


export type QueryListTriviaCategoriesArgs = {
  args?: InputMaybe<ListTriviaCategoriesArgs>;
};


export type QueryFindTriviaQuestionArgs = {
  id: Scalars['String']['input'];
};


export type QueryListTriviaQuestionsArgs = {
  args?: InputMaybe<ListTriviaQuestionsArgs>;
};


export type QueryFindTriviaReportArgs = {
  id: Scalars['String']['input'];
};


export type QueryListTriviaReportsArgs = {
  args?: InputMaybe<ListTriviaReportsArgs>;
};


export type QueryFindUserArgs = {
  id?: InputMaybe<Scalars['String']['input']>;
};


export type QueryListUsersArgs = {
  args?: InputMaybe<ListUsersArgs>;
};


export type QueryListPasskeysArgs = {
  userId: Scalars['String']['input'];
};

export type Mutation = {
  __typename?: 'Mutation';
  /** requires: admin */
  saveBlogEntry: BlogEntry;
  /** requires: admin */
  removeBlogEntries?: Maybe<Scalars['Void']['output']>;
  /** requires: sql/reader */
  sqlQuery: SqlQueryResult;
  /** public */
  saveTriviaCategory: TriviaCategory;
  /** requires: trivia/admin */
  verifyTriviaCategories?: Maybe<Scalars['Void']['output']>;
  /** requires: trivia/admin */
  removeTriviaCategories?: Maybe<Scalars['Void']['output']>;
  /** public */
  saveTriviaQuestion: TriviaQuestion;
  /** requires: trivia/admin */
  verifyTriviaQuestions?: Maybe<Scalars['Void']['output']>;
  /** requires: trivia/admin */
  removeTriviaQuestions?: Maybe<Scalars['Void']['output']>;
  /** public */
  saveTriviaReport: TriviaReport;
  /** requires: trivia/admin */
  removeTriviaReports?: Maybe<Scalars['Void']['output']>;
  /** public */
  createUser: User;
  /** requires: admin or current_user */
  saveUser: User;
  /** requires: admin or current_user */
  removeUsers?: Maybe<Scalars['Void']['output']>;
  /** public */
  authenticate: UnionOf_AuthenticationResult_PasskeyAuthentication;
  /** public */
  authenticateWithPasskey: AuthenticationResult;
  /** public */
  beginPasskeyRegistration: Scalars['String']['output'];
  /** public */
  finishPasskeyRegistration?: Maybe<Scalars['Void']['output']>;
  /** requires: admin or current_user */
  removePasskeys?: Maybe<Scalars['Void']['output']>;
  /** public */
  updatePassword?: Maybe<Scalars['Void']['output']>;
  /** public */
  requestPasswordReset: Scalars['String']['output'];
  /** public */
  updatePasswordByResetRequest?: Maybe<Scalars['Void']['output']>;
  /** public */
  savePushSubscription: UserPushSubscription;
  /** requires: admin or current_user */
  removePushSubscriptions?: Maybe<Scalars['Void']['output']>;
  /** requires: admin or current_user */
  testPushSubscriptions?: Maybe<Scalars['Void']['output']>;
};


export type MutationSaveBlogEntryArgs = {
  input: BlogEntryInput;
};


export type MutationRemoveBlogEntriesArgs = {
  ids: Array<Scalars['String']['input']>;
};


export type MutationSqlQueryArgs = {
  sql: Scalars['String']['input'];
};


export type MutationSaveTriviaCategoryArgs = {
  input: TriviaCategoryInput;
};


export type MutationVerifyTriviaCategoriesArgs = {
  ids: Array<Scalars['String']['input']>;
};


export type MutationRemoveTriviaCategoriesArgs = {
  ids: Array<Scalars['String']['input']>;
};


export type MutationSaveTriviaQuestionArgs = {
  input: TriviaQuestionInput;
};


export type MutationVerifyTriviaQuestionsArgs = {
  ids: Array<Scalars['String']['input']>;
};


export type MutationRemoveTriviaQuestionsArgs = {
  ids: Array<Scalars['String']['input']>;
};


export type MutationSaveTriviaReportArgs = {
  input: TriviaReportInput;
};


export type MutationRemoveTriviaReportsArgs = {
  ids: Array<Scalars['String']['input']>;
};


export type MutationCreateUserArgs = {
  username: Scalars['String']['input'];
  password: Scalars['String']['input'];
};


export type MutationSaveUserArgs = {
  input: UserInput;
};


export type MutationRemoveUsersArgs = {
  ids: Array<Scalars['String']['input']>;
};


export type MutationAuthenticateArgs = {
  username: Scalars['String']['input'];
  password: Scalars['String']['input'];
};


export type MutationAuthenticateWithPasskeyArgs = {
  userId: Scalars['String']['input'];
  response: Scalars['String']['input'];
};


export type MutationFinishPasskeyRegistrationArgs = {
  passkeyName: Scalars['String']['input'];
  response: Scalars['String']['input'];
};


export type MutationRemovePasskeysArgs = {
  ids: Array<Scalars['String']['input']>;
};


export type MutationUpdatePasswordArgs = {
  userId: Scalars['String']['input'];
  password: Scalars['String']['input'];
};


export type MutationRequestPasswordResetArgs = {
  username: Scalars['String']['input'];
  message?: InputMaybe<Scalars['String']['input']>;
};


export type MutationUpdatePasswordByResetRequestArgs = {
  requestId: Scalars['String']['input'];
  password: Scalars['String']['input'];
};


export type MutationSavePushSubscriptionArgs = {
  input: UserPushSubscriptionInput;
};


export type MutationRemovePushSubscriptionsArgs = {
  ids: Array<Scalars['String']['input']>;
};


export type MutationTestPushSubscriptionsArgs = {
  ids: Array<Scalars['String']['input']>;
};

export type BlogEntry = {
  __typename?: 'BlogEntry';
  id: Scalars['String']['output'];
  shortid: Scalars['String']['output'];
  story: Scalars['String']['output'];
  title: Scalars['String']['output'];
  message?: Maybe<Scalars['String']['output']>;
  mediaType: Scalars['String']['output'];
  mediaInfo?: Maybe<Scalars['String']['output']>;
  previewAspectRatio: Scalars['Float']['output'];
  createdAt: Scalars['String']['output'];
  /** public */
  mediaUrl: Scalars['String']['output'];
  /** public */
  previewUrl: Scalars['String']['output'];
};

export type BlogEntryListConnection = {
  __typename?: 'BlogEntryListConnection';
  slice: Array<BlogEntry>;
  pageIndex: Scalars['Float']['output'];
  pageCount: Scalars['Float']['output'];
};

export type ListBlogEntriesArgs = {
  window?: InputMaybe<Window>;
  search?: InputMaybe<Scalars['String']['input']>;
  sorting?: InputMaybe<Sorting>;
};

export type Window = {
  offset?: Scalars['Float']['input'];
  limit?: Scalars['Float']['input'];
};

export type Sorting = {
  col: Scalars['String']['input'];
  dir: SortDirection;
};

export type SortDirection =
  | 'ASC'
  | 'DESC';

export type BlogEntryInput = {
  id?: InputMaybe<Scalars['String']['input']>;
  shortid?: InputMaybe<Scalars['String']['input']>;
  story: Scalars['String']['input'];
  title: Scalars['String']['input'];
  message?: InputMaybe<Scalars['String']['input']>;
  previewFile?: InputMaybe<Scalars['File']['input']>;
  mediaFile: Scalars['File']['input'];
  mediaType?: InputMaybe<Scalars['String']['input']>;
  mediaInfo?: InputMaybe<Scalars['String']['input']>;
  previewAspectRatio?: InputMaybe<Scalars['Float']['input']>;
};

export type ServerConfig = {
  __typename?: 'ServerConfig';
  emailsEnabled: Scalars['Boolean']['output'];
  webpushPublicKey: Scalars['String']['output'];
};

export type ServerLoadResultObject = {
  __typename?: 'ServerLoadResultObject';
  timestamp: Scalars['String']['output'];
  requestsPerMinute: Scalars['Float']['output'];
  averageResponseTimeInMs: Scalars['Float']['output'];
  averageSystemLoad: Scalars['Float']['output'];
  totalMemoryInGB: Scalars['Float']['output'];
  averageFreeMemoryInGB: Scalars['Float']['output'];
  averageUsedMemoryInGB: Scalars['Float']['output'];
};

export type AuditLogListConnection = {
  __typename?: 'AuditLogListConnection';
  slice: Array<AuditLog>;
  pageIndex: Scalars['Float']['output'];
  pageCount: Scalars['Float']['output'];
};

export type AuditLog = {
  __typename?: 'AuditLog';
  id: Scalars['String']['output'];
  srcTable: Scalars['String']['output'];
  srcRowid?: Maybe<Scalars['Unknown']['output']>;
  operation: Scalars['String']['output'];
  timestamp: Scalars['String']['output'];
  newValues: Scalars['String']['output'];
  oldValues: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  userId?: Maybe<Scalars['String']['output']>;
  /** public */
  user?: Maybe<User>;
};

export type User = {
  __typename?: 'User';
  id: Scalars['String']['output'];
  username: Scalars['String']['output'];
  activated: Scalars['Boolean']['output'];
  createdAt: Scalars['String']['output'];
  /** public */
  roles: Array<UserRole>;
  /** public */
  passkeys: Array<UserPasskey>;
  /** public */
  pushSubscriptions: Array<UserPushSubscription>;
};

export type UserRole = {
  __typename?: 'UserRole';
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
};

export type ListAuditLogArgs = {
  window?: InputMaybe<Window>;
  srcTable?: InputMaybe<Scalars['String']['input']>;
  srcRowid?: InputMaybe<Scalars['Unknown']['input']>;
};

export type SqlQueryResult = {
  __typename?: 'SQLQueryResult';
  error?: Maybe<Scalars['String']['output']>;
  dataAsJson?: Maybe<Scalars['String']['output']>;
};

export type TriviaCategory = {
  __typename?: 'TriviaCategory';
  id: Scalars['String']['output'];
  name: Scalars['String']['output'];
  description?: Maybe<Scalars['String']['output']>;
  submitter?: Maybe<Scalars['String']['output']>;
  verified: Scalars['Boolean']['output'];
  createdAt: Scalars['String']['output'];
  /** public */
  questionsCount: Scalars['Float']['output'];
};

export type TriviaCategoryListConnection = {
  __typename?: 'TriviaCategoryListConnection';
  slice: Array<TriviaCategory>;
  pageIndex: Scalars['Float']['output'];
  pageCount: Scalars['Float']['output'];
};

export type ListTriviaCategoriesArgs = {
  window?: InputMaybe<Window>;
  search?: InputMaybe<Scalars['String']['input']>;
  sorting?: InputMaybe<Sorting>;
  verified?: InputMaybe<Scalars['Boolean']['input']>;
};

export type TriviaQuestion = {
  __typename?: 'TriviaQuestion';
  id: Scalars['String']['output'];
  question: Scalars['String']['output'];
  answer: Scalars['String']['output'];
  hint1?: Maybe<Scalars['String']['output']>;
  hint2?: Maybe<Scalars['String']['output']>;
  submitter?: Maybe<Scalars['String']['output']>;
  verified: Scalars['Boolean']['output'];
  createdAt: Scalars['String']['output'];
  /** public */
  categories: Array<TriviaCategory>;
  /** requires: trivia/admin */
  reportsCount: Scalars['Float']['output'];
  /** requires: trivia/admin */
  reports: Array<TriviaReport>;
};

export type TriviaQuestionListConnection = {
  __typename?: 'TriviaQuestionListConnection';
  slice: Array<TriviaQuestion>;
  pageIndex: Scalars['Float']['output'];
  pageCount: Scalars['Float']['output'];
};

export type ListTriviaQuestionsArgs = {
  window?: InputMaybe<Window>;
  search?: InputMaybe<Scalars['String']['input']>;
  sorting?: InputMaybe<Sorting>;
  verified?: InputMaybe<Scalars['Boolean']['input']>;
  shuffled?: InputMaybe<Scalars['Boolean']['input']>;
  includeCategories?: InputMaybe<Array<Scalars['String']['input']>>;
  excludeCategories?: InputMaybe<Array<Scalars['String']['input']>>;
  includeSubmitters?: InputMaybe<Array<Scalars['String']['input']>>;
  excludeSubmitters?: InputMaybe<Array<Scalars['String']['input']>>;
  categoryId?: InputMaybe<Scalars['String']['input']>;
};

export type TriviaReport = {
  __typename?: 'TriviaReport';
  id: Scalars['String']['output'];
  questionId: Scalars['String']['output'];
  message: Scalars['String']['output'];
  submitter: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  /** public */
  question?: Maybe<TriviaQuestion>;
};

export type TriviaReportListConnection = {
  __typename?: 'TriviaReportListConnection';
  slice: Array<TriviaReport>;
  pageIndex: Scalars['Float']['output'];
  pageCount: Scalars['Float']['output'];
};

export type ListTriviaReportsArgs = {
  window?: InputMaybe<Window>;
  search?: InputMaybe<Scalars['String']['input']>;
  sorting?: InputMaybe<Sorting>;
  questionId?: InputMaybe<Scalars['String']['input']>;
};

export type TriviaCounts = {
  __typename?: 'TriviaCounts';
  categories: Scalars['Float']['output'];
  categoriesNotVerified: Scalars['Float']['output'];
  questions: Scalars['Float']['output'];
  questionsNotVerified: Scalars['Float']['output'];
  reports: Scalars['Float']['output'];
};

export type TriviaCategoryInput = {
  id?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
  submitter?: InputMaybe<Scalars['String']['input']>;
};

export type TriviaQuestionInput = {
  id?: InputMaybe<Scalars['String']['input']>;
  question: Scalars['String']['input'];
  answer: Scalars['String']['input'];
  hint1?: InputMaybe<Scalars['String']['input']>;
  hint2?: InputMaybe<Scalars['String']['input']>;
  submitter?: InputMaybe<Scalars['String']['input']>;
  /** public */
  categories: Array<TriviaCategoryInput>;
};

export type TriviaReportInput = {
  id?: InputMaybe<Scalars['String']['input']>;
  questionId: Scalars['String']['input'];
  message: Scalars['String']['input'];
  submitter: Scalars['String']['input'];
};

export type UserListConnection = {
  __typename?: 'UserListConnection';
  slice: Array<User>;
  pageIndex: Scalars['Float']['output'];
  pageCount: Scalars['Float']['output'];
};

export type ListUsersArgs = {
  window?: InputMaybe<Window>;
  search?: InputMaybe<Scalars['String']['input']>;
  sorting?: InputMaybe<Sorting>;
};

export type UserPasskey = {
  __typename?: 'UserPasskey';
  id: Scalars['String']['output'];
  userId: Scalars['String']['output'];
  name: Scalars['String']['output'];
  transports?: Maybe<Scalars['String']['output']>;
  counter: Scalars['Float']['output'];
  backedUp: Scalars['Boolean']['output'];
  deviceType: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  /** public */
  user?: Maybe<User>;
};

export type UserPasswordResetRequest = {
  __typename?: 'UserPasswordResetRequest';
  id: Scalars['String']['output'];
  userId: Scalars['String']['output'];
  message?: Maybe<Scalars['String']['output']>;
  createdAt: Scalars['String']['output'];
  /** public */
  user?: Maybe<User>;
};

export type UserInput = {
  id?: InputMaybe<Scalars['String']['input']>;
  username: Scalars['String']['input'];
  activated?: InputMaybe<Scalars['Boolean']['input']>;
  /** public */
  roles?: InputMaybe<Array<UserRoleInput>>;
};

export type UserRoleInput = {
  id?: InputMaybe<Scalars['String']['input']>;
  name: Scalars['String']['input'];
  description?: InputMaybe<Scalars['String']['input']>;
};

export type UnionOf_AuthenticationResult_PasskeyAuthentication = AuthenticationResult | PasskeyAuthentication;

export type AuthenticationResult = {
  __typename?: 'AuthenticationResult';
  user: User;
  token: Scalars['String']['output'];
};

export type PasskeyAuthentication = {
  __typename?: 'PasskeyAuthentication';
  userId: Scalars['String']['output'];
  options: Scalars['String']['output'];
};

export type UserPushSubscription = {
  __typename?: 'UserPushSubscription';
  id: Scalars['String']['output'];
  userId: Scalars['String']['output'];
  device: Scalars['String']['output'];
  data: Scalars['String']['output'];
  createdAt: Scalars['String']['output'];
  /** public */
  user?: Maybe<User>;
};

export type UserPushSubscriptionInput = {
  id?: InputMaybe<Scalars['String']['input']>;
  userId: Scalars['String']['input'];
  device: Scalars['String']['input'];
  data: Scalars['String']['input'];
};
