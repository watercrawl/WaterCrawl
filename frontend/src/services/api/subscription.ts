import api from './api';
import { Subscription, CreateSubscriptionRequest, CreateSubscriptionResponse, Plan, CurrentSubscription, CancelSubscriptionResponse, UpdatePaymentMethodResponse } from '../../types/subscription';





export const subscriptionApi = {
  /**
   * Get a list of all active subscriptions for the team
   * @returns Promise with array of subscriptions
   */
  async getSubscriptions(): Promise<Subscription[]> {
    return api.get<Subscription[]>('/api/v1/plan/subscriptions/').then(({ data }) => data);
  },

  /**
   * Get detailed information about a specific subscription
   * @param id - Subscription ID
   * @returns Promise with subscription details
   */
  async getSubscription(id: string): Promise<Subscription> {
    return api.get<Subscription>(`/api/v1/plan/subscriptions/${id}/`).then(({ data }) => data);
  },

  /**
 * Create a new subscription for a plan
 * @param request - Subscription creation request
 * @returns Promise with subscription details
 */
  async createSubscription(request: CreateSubscriptionRequest): Promise<CreateSubscriptionResponse | null> {
    return api.post<CreateSubscriptionResponse>('/api/v1/plan/subscriptions/start/', request).then(({ data }) => data);
  },


  async currentSubscription(): Promise<CurrentSubscription | null> {
    return api.get<CurrentSubscription>('/api/v1/plan/subscriptions/current/').then(({ data }) => data);
  },

  /**
   * Cancel a subscription
   * @param immediately - Whether to cancel the subscription immediately or at the end of the billing period
   * @returns Promise with cancellation response
   */
  async cancelSubscription(immediately = false): Promise<CancelSubscriptionResponse> {
    return api.delete<CancelSubscriptionResponse>(`/api/v1/plan/subscriptions/cancel/`, { data: { immediately } }).then(({ data }) => data);
  },


  /**
   * Renew a subscription
   * @returns Promise with renewal response
   */
  async renewSubscription(): Promise<null> {
    return api.post<null>('/api/v1/plan/subscriptions/renew/').then(({ data }) => data);
  },

  /**
   *  Update payment method
   * @returns Promise with update payment method response
   */
  async manageSubscription(): Promise<UpdatePaymentMethodResponse> {
    return api.post<UpdatePaymentMethodResponse>('/api/v1/plan/subscriptions/manage-subscription/').then(({ data }) => data);
  },

  /**
   * Get a list of all available plans
   * @returns Promise with array of plans
   */
  async getPlans(): Promise<Plan[]> {
    return api.get<Plan[]>('/api/v1/plan/plans/').then(({ data }) => data);
  },

  /**
   * Get detailed information about a specific plan
   * @param id - Plan ID
   * @returns Promise with plan details
   */
  async getPlan(id: string): Promise<Plan> {
    return api.get<Plan>(`/api/v1/plan/plans/${id}/`).then(({ data }) => data);
  },

};

export default subscriptionApi;