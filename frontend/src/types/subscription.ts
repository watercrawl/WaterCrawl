export interface PlanFeature {
  title: string;
  help_text?: string;
  icon?: string;
}

export interface Plan {
  uuid: string;
  name: string;
  label?: string;
  group: string;
  description: string;
  price_before_discount?: number;
  price: number;
  number_of_users: number;
  page_credit: number;
  daily_page_credit: number;
  crawl_max_depth: number;
  crawl_max_limit: number;
  max_concurrent_crawl: number;
  is_default: boolean;
  features: PlanFeature[];

}

/**
 * A subscription to a plan.
 *
 * Contains the plan's uuid, details, and the user's current status.
 * The plan's details include the number of users and page credits.
 * The user's current status includes the remaining page credits and the subscription's start and end dates.
 */
export interface Subscription {
  uuid: string;
  plan: Plan;
  status: string;
  page_credit: number;
  remain_page_credit: number;
  remain_daily_page_credit: number;
  start_at: string;
  current_period_start_at: string;
  current_period_end_at: string;
  cancel_at: string | null;
}

export interface CreateSubscriptionRequest {
  plan_uuid: string;
}

export interface CreateSubscriptionResponse {
  redirect_url: string;
}


export interface UpdatePaymentMethodResponse {
  redirect_url: string;
}

export interface CancelSubscriptionResponse {
  redirect_url?: string;
}

export interface CurrentSubscription {
  plan_name: string;
  status: string;
  plan_page_credit: number;
  plan_daily_page_credit: number;
  plan_number_users: number;
  remain_number_users: number;
  remaining_page_credit: number;
  remaining_daily_page_credit: number;
  max_depth: number;
  max_concurrent_crawl: number;
  number_of_knowledge_bases: number;
  number_of_each_knowledge_base_documents: number;
  knowledge_base_retrival_rate_limit: string;
  start_at: string;
  current_period_start_at: string;
  current_period_end_at: string;
  cancel_at: string | null;
  is_default: boolean;
}