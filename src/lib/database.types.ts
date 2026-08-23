/**
 * Hand-maintained mirror of supabase/schema.sql.
 * Keep the two in sync whenever the schema changes.
 */

export type UserRole = 'dayar' | 'vaad';
export type FaultStatus = 'open' | 'in_progress' | 'closed';
export type FaultCategory =
  | 'elevator'
  | 'plumbing'
  | 'electricity'
  | 'cleaning'
  | 'parking'
  | 'structure'
  | 'other';
export type TransactionType = 'income' | 'expense';
export type ProposalStatus = 'open' | 'closed';
export type VoteChoice = 'for' | 'against';
export type PostKind = 'offer' | 'request' | 'group_buy' | 'lending' | 'other';
export type PostStatus = 'active' | 'closed';

export type Building = {
  id: string;
  name: string;
  address: string | null;
  created_at: string;
};

export type AppUser = {
  id: string;
  building_id: string;
  full_name: string;
  apartment_number: string | null;
  role: UserRole;
  created_at: string;
  notifications_seen_at: string;
};

export type Fault = {
  id: string;
  building_id: string;
  reported_by: string;
  title: string;
  description: string | null;
  category: FaultCategory;
  status: FaultStatus;
  created_at: string;
  updated_at: string;
};

export type BudgetTransaction = {
  id: string;
  building_id: string;
  created_by: string;
  type: TransactionType;
  amount: number;
  description: string;
  date: string;
  created_at: string;
  /** Set on a correcting entry, pointing at the transaction it cancels out. */
  reverses_id: string | null;
};

export type Proposal = {
  id: string;
  building_id: string;
  title: string;
  description: string | null;
  creator_anonymous: boolean;
  closes_at: string | null;
  status: ProposalStatus;
  created_at: string;
};

export type Vote = {
  id: string;
  proposal_id: string;
  user_id: string;
  vote: VoteChoice;
  voter_anonymous: boolean;
  created_at: string;
};

/** Shape returned by the get_proposals() RPC. */
export type ProposalView = {
  id: string;
  title: string;
  description: string | null;
  creator_anonymous: boolean;
  creator_name: string | null;
  is_mine: boolean;
  closes_at: string | null;
  status: ProposalStatus;
  created_at: string;
  votes_for: number;
  votes_against: number;
  my_vote: VoteChoice | null;
};

export type ProposalVoter = {
  name: string | null;
  apartment: string | null;
  vote: VoteChoice;
  anonymous: boolean;
};

export type ProposalResults = {
  votes_for: number;
  votes_against: number;
  total_votes: number;
  is_closed: boolean;
  voters: ProposalVoter[];
};

export type BudgetSummary = {
  total_income: number;
  total_expense: number;
  balance: number;
  tx_count: number;
};

export type NeighbourPost = {
  id: string;
  building_id: string;
  created_by: string;
  kind: PostKind;
  title: string;
  description: string | null;
  price_note: string | null;
  contact: string | null;
  expires_at: string | null;
  status: PostStatus;
  created_at: string;
};

export type PostInterest = {
  id: string;
  post_id: string;
  user_id: string;
  created_at: string;
};

export type NotificationKind =
  | 'fault_new'
  | 'fault_status'
  | 'transaction'
  | 'proposal_new'
  | 'proposal_closed'
  | 'post_new';

export type AppNotification = {
  kind: NotificationKind;
  entity_id: string;
  title: string;
  detail: string;
  at: string;
  is_new: boolean;
};

export type InviteCodes = {
  dayar_code: string;
  vaad_code: string;
};

type Row<T> = T;
type Insert<T> = T;
type Update<T> = Partial<T>;

export type Database = {
  public: {
    Tables: {
      buildings: {
        Row: Row<Building>;
        Insert: Insert<Omit<Building, 'id' | 'created_at'>>;
        Update: Update<Building>;
        Relationships: [];
      };
      users: {
        Row: Row<AppUser>;
        Insert: Insert<Omit<AppUser, 'created_at'>>;
        Update: Update<Pick<AppUser, 'full_name' | 'apartment_number'>>;
        Relationships: [];
      };
      faults: {
        Row: Row<Fault>;
        Insert: Insert<
          Omit<Fault, 'id' | 'created_at' | 'updated_at' | 'status'> & {
            status?: FaultStatus;
          }
        >;
        Update: Update<Pick<Fault, 'status'>>;
        Relationships: [];
      };
      budget_transactions: {
        Row: Row<BudgetTransaction>;
        Insert: Insert<
          Omit<BudgetTransaction, 'id' | 'created_at' | 'date' | 'reverses_id'> & {
            date?: string;
            reverses_id?: string | null;
          }
        >;
        Update: Update<BudgetTransaction>;
        Relationships: [];
      };
      proposals: {
        Row: Row<Proposal>;
        Insert: Insert<
          Omit<Proposal, 'id' | 'created_at' | 'status'> & {
            created_by: string;
            status?: ProposalStatus;
          }
        >;
        Update: Update<Proposal>;
        Relationships: [];
      };
      neighbour_posts: {
        Row: Row<NeighbourPost>;
        Insert: Insert<
          Omit<NeighbourPost, 'id' | 'created_at' | 'status'> & {
            status?: PostStatus;
          }
        >;
        Update: Update<Pick<NeighbourPost, 'status'>>;
        Relationships: [];
      };
      post_interests: {
        Row: Row<PostInterest>;
        Insert: Insert<Omit<PostInterest, 'id' | 'created_at'>>;
        Update: Update<PostInterest>;
        Relationships: [];
      };
      votes: {
        Row: Row<Vote>;
        Insert: Insert<Omit<Vote, 'id' | 'created_at'>>;
        Update: Update<Vote>;
        Relationships: [];
      };
    };
    Views: Record<never, never>;
    Functions: {
      create_building: {
        Args: {
          p_name: string;
          p_address: string | null;
          p_full_name: string;
          p_apartment_number: string | null;
        };
        Returns: { building_id: string; dayar_code: string; vaad_code: string }[];
      };
      join_building: {
        Args: {
          p_invite_code: string;
          p_full_name: string;
          p_apartment_number: string | null;
        };
        Returns: {
          building_id: string;
          building_name: string;
          assigned_role: UserRole;
        }[];
      };
      get_invite_codes: {
        Args: Record<never, never>;
        Returns: InviteCodes[];
      };
      get_building_budget_summary: {
        Args: Record<never, never>;
        Returns: BudgetSummary[];
      };
      get_proposals: {
        Args: { p_id?: string | null };
        Returns: ProposalView[];
      };
      get_proposal_results: {
        Args: { p_proposal_id: string };
        Returns: ProposalResults[];
      };
      reverse_transaction: {
        Args: { p_transaction_id: string };
        Returns: string;
      };
      close_proposal: {
        Args: { p_proposal_id: string };
        Returns: undefined;
      };
      get_notifications: {
        Args: { p_limit?: number };
        Returns: AppNotification[];
      };
      mark_notifications_seen: {
        Args: Record<never, never>;
        Returns: undefined;
      };
      vote_on_proposal: {
        Args: {
          p_proposal_id: string;
          p_vote: VoteChoice;
          p_anonymous: boolean;
        };
        Returns: undefined;
      };
      my_building_id: { Args: Record<never, never>; Returns: string | null };
      my_role: { Args: Record<never, never>; Returns: UserRole | null };
      is_vaad: { Args: Record<never, never>; Returns: boolean };
    };
    Enums: {
      user_role: UserRole;
      fault_status: FaultStatus;
      fault_category: FaultCategory;
      transaction_type: TransactionType;
      proposal_status: ProposalStatus;
      vote_choice: VoteChoice;
      post_kind: PostKind;
      post_status: PostStatus;
    };
    CompositeTypes: Record<never, never>;
  };
};
