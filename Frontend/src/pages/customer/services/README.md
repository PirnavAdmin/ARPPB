# Customer Portal service boundary

Customer Portal records currently come from `context/CustomerContext.jsx` and
`data/customerData.js`. Profile, product, category, cart, order, purchase
history, notification, and purchase-confirmation API contracts are not present
in this frontend, so the demo data flow remains active.

The customer context remains the demo source of truth because actions such as
placing an order update the cart, orders, OTP confirmations, purchase history,
and notifications together. Splitting those records before a server contract
exists risks competing copies of the same demo state. Read paths already use
memoized derivations for filtering and totals, and the product searches are
debounced. As API domains are introduced, move each domain behind its service
and hook together, then narrow context subscriptions so unrelated pages do
not rerender for every update.

Remaining browser persistence is namespaced by the authenticated customer
identity. Generated demo OTPs remain in memory and are removed from persisted
confirmation records. Frontend-only demo OTP flows remain unsuitable for
production verification.

When the backend contracts are available:

1. Add Customer Portal endpoint constants to `src/API/Endpoints.js` from the
   approved backend contract.
2. Implement domain services in this directory. Services should use the
   existing authenticated Axios instance from `src/API/Config.js`; its request
   interceptor attaches the stored bearer token.
3. Keep request and response DTO mapping in service or mapper modules, and
   expose loading, success, empty, and error state to the UI through hooks.
4. Replace each demo data source only after its matching API behavior is
   verified. Do not infer routes, payload fields, or authorization rules.

The similarly named `src/services/api.js` provides local-storage helpers used
by other application modules. Its Axios export is not the authenticated API
client and should not be used for Customer Portal backend requests.
