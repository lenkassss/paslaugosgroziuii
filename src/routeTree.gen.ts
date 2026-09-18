import { Route as rootRouteImport } from './routes/__root'
import { Route as TiekejaiRouteImport } from './routes/tiekejai'
import { Route as TaisyklesRouteImport } from './routes/taisykles'
import { Route as SkelbimaiRouteImport } from './routes/skelbimai'
import { Route as SearchRouteImport } from './routes/search'
import { Route as SalonaiRouteImport } from './routes/salonai'
import { Route as PrivatumasRouteImport } from './routes/privatumas'
import { Route as PricingRouteImport } from './routes/pricing'
import { Route as PrekiniaiZenklaiRouteImport } from './routes/prekiniai-zenklai'
import { Route as MokyklosRouteImport } from './routes/mokyklos'
import { Route as MeistraiRouteImport } from './routes/meistrai'
import { Route as MegstamiRouteImport } from './routes/megstami'
import { Route as IeskomiModeliaiRouteImport } from './routes/ieskomi-modeliai'
import { Route as ForumasRouteImport } from './routes/forumas'
import { Route as ForSuppliersRouteImport } from './routes/for-suppliers'
import { Route as ForBusinessRouteImport } from './routes/for-business'
import { Route as DukRouteImport } from './routes/duk'
import { Route as DarbasRouteImport } from './routes/darbas'
import { Route as ContactRouteImport } from './routes/contact'
import { Route as AuthRouteImport } from './routes/auth'
import { Route as AboutRouteImport } from './routes/about'
import { Route as AuthenticatedRouteRouteImport } from './routes/_authenticated/route'
import { Route as IndexRouteImport } from './routes/index'
import { Route as ShopIndexRouteImport } from './routes/shop.index'
import { Route as ShopSlugRouteImport } from './routes/shop.$slug'
import { Route as SalonIdRouteImport } from './routes/salon.$id'
import { Route as MokyklosSlugRouteImport } from './routes/mokyklos.$slug'
import { Route as ForumasSlugRouteImport } from './routes/forumas.$slug'
import { Route as FeedRenginiaiRouteImport } from './routes/feed.renginiai'
import { Route as FeedPatalposRouteImport } from './routes/feed.patalpos'
import { Route as FeedAkcijosRouteImport } from './routes/feed.akcijos'
import { Route as DarbasSlugRouteImport } from './routes/darbas.$slug'
import { Route as ArticleSlugRouteImport } from './routes/article.$slug'
import { Route as AppointmentTokenRouteImport } from './routes/appointment.$token'
import { Route as AuthenticatedVerslasRouteImport } from './routes/_authenticated/verslas'
import { Route as AuthenticatedPushTesterRouteImport } from './routes/_authenticated/push-tester'
import { Route as AuthenticatedProfileRouteImport } from './routes/_authenticated/profile'
import { Route as AuthenticatedOrdersRouteImport } from './routes/_authenticated/orders'
import { Route as AuthenticatedNotificationsRouteImport } from './routes/_authenticated/notifications'
import { Route as AuthenticatedSuperAdminRouteRouteImport } from './routes/_authenticated/super-admin.route'
import { Route as AuthenticatedAdminRouteRouteImport } from './routes/_authenticated/admin.route'
import { Route as AuthenticatedSuperAdminIndexRouteImport } from './routes/_authenticated/super-admin.index'
import { Route as AuthenticatedAdminIndexRouteImport } from './routes/_authenticated/admin.index'
import { Route as ForumasTemaIdRouteImport } from './routes/forumas.tema.$id'
import { Route as AuthenticatedSuperAdminGrantsRouteImport } from './routes/_authenticated/super-admin.grants'
import { Route as AuthenticatedSuperAdminFinanceRouteImport } from './routes/_authenticated/super-admin.finance'
import { Route as AuthenticatedSuperAdminBroadcastRouteImport } from './routes/_authenticated/super-admin.broadcast'
import { Route as AuthenticatedSuperAdminBackupsRouteImport } from './routes/_authenticated/super-admin.backups'
import { Route as AuthenticatedDashboardCustomerRouteImport } from './routes/_authenticated/dashboard.customer'
import { Route as AuthenticatedDashboardB2bRouteImport } from './routes/_authenticated/dashboard.b2b'
import { Route as AuthenticatedDashboardAddonsRouteImport } from './routes/_authenticated/dashboard.addons'
import { Route as AuthenticatedAdminVerificationsRouteImport } from './routes/_authenticated/admin.verifications'
import { Route as AuthenticatedAdminUsersRouteImport } from './routes/_authenticated/admin.users'
import { Route as AuthenticatedAdminSystemRouteImport } from './routes/_authenticated/admin.system'
import { Route as AuthenticatedAdminSupplierRequestsRouteImport } from './routes/_authenticated/admin.supplier-requests'
import { Route as AuthenticatedAdminSuggestionsRouteImport } from './routes/_authenticated/admin.suggestions'
import { Route as AuthenticatedAdminSiteEditorRouteImport } from './routes/_authenticated/admin.site-editor'
import { Route as AuthenticatedAdminPromotionsRouteImport } from './routes/_authenticated/admin.promotions'
import { Route as AuthenticatedAdminMembershipsRouteImport } from './routes/_authenticated/admin.memberships'
import { Route as AuthenticatedAdminContentRouteImport } from './routes/_authenticated/admin.content'
import { Route as AuthenticatedAdminCommentsRouteImport } from './routes/_authenticated/admin.comments'
import { Route as AuthenticatedAdminCatalogRouteImport } from './routes/_authenticated/admin.catalog'
import { Route as AuthenticatedAdminAuditRouteImport } from './routes/_authenticated/admin.audit'
import { Route as AuthenticatedAdminApprovalsRouteImport } from './routes/_authenticated/admin.approvals'
import { Route as AuthenticatedAdminAppointmentsRouteImport } from './routes/_authenticated/admin.appointments'
import { Route as AuthenticatedAdminAdsRouteImport } from './routes/_authenticated/admin.ads'
import { Route as ApiPublicWebhooksStripeRouteImport } from './routes/api/public/webhooks/stripe'
import { Route as AuthenticatedDashboardSupplierProfileRouteImport } from './routes/_authenticated/dashboard.supplier.profile'
import { Route as AuthenticatedDashboardSupplierProductsRouteImport } from './routes/_authenticated/dashboard.supplier.products'
import { Route as AuthenticatedDashboardSupplierMembershipRouteImport } from './routes/_authenticated/dashboard.supplier.membership'
import { Route as AuthenticatedDashboardSupplierFeedRouteImport } from './routes/_authenticated/dashboard.supplier.feed'
import { Route as AuthenticatedDashboardSupplierEventsRouteImport } from './routes/_authenticated/dashboard.supplier.events'
import { Route as AuthenticatedDashboardSchoolRegistrationsRouteImport } from './routes/_authenticated/dashboard.school.registrations'
import { Route as AuthenticatedDashboardSchoolCoursesRouteImport } from './routes/_authenticated/dashboard.school.courses'
import { Route as AuthenticatedDashboardSalonWalletRouteImport } from './routes/_authenticated/dashboard.salon.wallet'
import { Route as AuthenticatedDashboardSalonVerificationRouteImport } from './routes/_authenticated/dashboard.salon.verification'
import { Route as AuthenticatedDashboardSalonStaffRouteImport } from './routes/_authenticated/dashboard.salon.staff'
import { Route as AuthenticatedDashboardSalonServicesRouteImport } from './routes/_authenticated/dashboard.salon.services'
import { Route as AuthenticatedDashboardSalonRentalsRouteImport } from './routes/_authenticated/dashboard.salon.rentals'
import { Route as AuthenticatedDashboardSalonPromoteRouteImport } from './routes/_authenticated/dashboard.salon.promote'
import { Route as AuthenticatedDashboardSalonProfileRouteImport } from './routes/_authenticated/dashboard.salon.profile'
import { Route as AuthenticatedDashboardSalonOverviewRouteImport } from './routes/_authenticated/dashboard.salon.overview'
import { Route as AuthenticatedDashboardSalonModelsRouteImport } from './routes/_authenticated/dashboard.salon.models'
import { Route as AuthenticatedDashboardSalonMembershipRouteImport } from './routes/_authenticated/dashboard.salon.membership'
import { Route as AuthenticatedDashboardSalonInquiriesRouteImport } from './routes/_authenticated/dashboard.salon.inquiries'
import { Route as AuthenticatedDashboardSalonFeaturedRouteImport } from './routes/_authenticated/dashboard.salon.featured'
import { Route as AuthenticatedDashboardSalonEventsRouteImport } from './routes/_authenticated/dashboard.salon.events'
import { Route as AuthenticatedDashboardSalonContentRouteImport } from './routes/_authenticated/dashboard.salon.content'
import { Route as AuthenticatedDashboardSalonClientsRouteImport } from './routes/_authenticated/dashboard.salon.clients'
import { Route as AuthenticatedDashboardSalonCalendarRouteImport } from './routes/_authenticated/dashboard.salon.calendar'
import { Route as AuthenticatedDashboardSalonAppointmentsRouteImport } from './routes/_authenticated/dashboard.salon.appointments'
import { Route as AuthenticatedDashboardEmployerJobsRouteImport } from './routes/_authenticated/dashboard.employer.jobs'

const TiekejaiRoute = TiekejaiRouteImport.update({
  id: '/tiekejai',
  path: '/tiekejai',
  getParentRoute: () => rootRouteImport,
} as any)
const TaisyklesRoute = TaisyklesRouteImport.update({
  id: '/taisykles',
  path: '/taisykles',
  getParentRoute: () => rootRouteImport,
} as any)
const SkelbimaiRoute = SkelbimaiRouteImport.update({
  id: '/skelbimai',
  path: '/skelbimai',
  getParentRoute: () => rootRouteImport,
} as any)
const SearchRoute = SearchRouteImport.update({
  id: '/search',
  path: '/search',
  getParentRoute: () => rootRouteImport,
} as any)
const SalonaiRoute = SalonaiRouteImport.update({
  id: '/salonai',
  path: '/salonai',
  getParentRoute: () => rootRouteImport,
} as any)
const PrivatumasRoute = PrivatumasRouteImport.update({
  id: '/privatumas',
  path: '/privatumas',
  getParentRoute: () => rootRouteImport,
} as any)
const PricingRoute = PricingRouteImport.update({
  id: '/pricing',
  path: '/pricing',
  getParentRoute: () => rootRouteImport,
} as any)
const PrekiniaiZenklaiRoute = PrekiniaiZenklaiRouteImport.update({
  id: '/prekiniai-zenklai',
  path: '/prekiniai-zenklai',
  getParentRoute: () => rootRouteImport,
} as any)
const MokyklosRoute = MokyklosRouteImport.update({
  id: '/mokyklos',
  path: '/mokyklos',
  getParentRoute: () => rootRouteImport,
} as any)
const MeistraiRoute = MeistraiRouteImport.update({
  id: '/meistrai',
  path: '/meistrai',
  getParentRoute: () => rootRouteImport,
} as any)
const MegstamiRoute = MegstamiRouteImport.update({
  id: '/megstami',
  path: '/megstami',
  getParentRoute: () => rootRouteImport,
} as any)
const IeskomiModeliaiRoute = IeskomiModeliaiRouteImport.update({
  id: '/ieskomi-modeliai',
  path: '/ieskomi-modeliai',
  getParentRoute: () => rootRouteImport,
} as any)
const ForumasRoute = ForumasRouteImport.update({
  id: '/forumas',
  path: '/forumas',
  getParentRoute: () => rootRouteImport,
} as any)
const ForSuppliersRoute = ForSuppliersRouteImport.update({
  id: '/for-suppliers',
  path: '/for-suppliers',
  getParentRoute: () => rootRouteImport,
} as any)
const ForBusinessRoute = ForBusinessRouteImport.update({
  id: '/for-business',
  path: '/for-business',
  getParentRoute: () => rootRouteImport,
} as any)
const DukRoute = DukRouteImport.update({
  id: '/duk',
  path: '/duk',
  getParentRoute: () => rootRouteImport,
} as any)
const DarbasRoute = DarbasRouteImport.update({
  id: '/darbas',
  path: '/darbas',
  getParentRoute: () => rootRouteImport,
} as any)
const ContactRoute = ContactRouteImport.update({
  id: '/contact',
  path: '/contact',
  getParentRoute: () => rootRouteImport,
} as any)
const AuthRoute = AuthRouteImport.update({
  id: '/auth',
  path: '/auth',
  getParentRoute: () => rootRouteImport,
} as any)
const AboutRoute = AboutRouteImport.update({
  id: '/about',
  path: '/about',
  getParentRoute: () => rootRouteImport,
} as any)
const AuthenticatedRouteRoute = AuthenticatedRouteRouteImport.update({
  id: '/_authenticated',
  getParentRoute: () => rootRouteImport,
} as any)
const IndexRoute = IndexRouteImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => rootRouteImport,
} as any)
const ShopIndexRoute = ShopIndexRouteImport.update({
  id: '/shop/',
  path: '/shop/',
  getParentRoute: () => rootRouteImport,
} as any)
const ShopSlugRoute = ShopSlugRouteImport.update({
  id: '/shop/$slug',
  path: '/shop/$slug',
  getParentRoute: () => rootRouteImport,
} as any)
const SalonIdRoute = SalonIdRouteImport.update({
  id: '/salon/$id',
  path: '/salon/$id',
  getParentRoute: () => rootRouteImport,
} as any)
const MokyklosSlugRoute = MokyklosSlugRouteImport.update({
  id: '/$slug',
  path: '/$slug',
  getParentRoute: () => MokyklosRoute,
} as any)
const ForumasSlugRoute = ForumasSlugRouteImport.update({
  id: '/$slug',
  path: '/$slug',
  getParentRoute: () => ForumasRoute,
} as any)
const FeedRenginiaiRoute = FeedRenginiaiRouteImport.update({
  id: '/feed/renginiai',
  path: '/feed/renginiai',
  getParentRoute: () => rootRouteImport,
} as any)
const FeedPatalposRoute = FeedPatalposRouteImport.update({
  id: '/feed/patalpos',
  path: '/feed/patalpos',
  getParentRoute: () => rootRouteImport,
} as any)
const FeedAkcijosRoute = FeedAkcijosRouteImport.update({
  id: '/feed/akcijos',
  path: '/feed/akcijos',
  getParentRoute: () => rootRouteImport,
} as any)
const DarbasSlugRoute = DarbasSlugRouteImport.update({
  id: '/$slug',
  path: '/$slug',
  getParentRoute: () => DarbasRoute,
} as any)
const ArticleSlugRoute = ArticleSlugRouteImport.update({
  id: '/article/$slug',
  path: '/article/$slug',
  getParentRoute: () => rootRouteImport,
} as any)
const AppointmentTokenRoute = AppointmentTokenRouteImport.update({
  id: '/appointment/$token',
  path: '/appointment/$token',
  getParentRoute: () => rootRouteImport,
} as any)
const AuthenticatedVerslasRoute = AuthenticatedVerslasRouteImport.update({
  id: '/verslas',
  path: '/verslas',
  getParentRoute: () => AuthenticatedRouteRoute,
} as any)
const AuthenticatedPushTesterRoute = AuthenticatedPushTesterRouteImport.update({
  id: '/push-tester',
  path: '/push-tester',
  getParentRoute: () => AuthenticatedRouteRoute,
} as any)
const AuthenticatedProfileRoute = AuthenticatedProfileRouteImport.update({
  id: '/profile',
  path: '/profile',
  getParentRoute: () => AuthenticatedRouteRoute,
} as any)
const AuthenticatedOrdersRoute = AuthenticatedOrdersRouteImport.update({
  id: '/orders',
  path: '/orders',
  getParentRoute: () => AuthenticatedRouteRoute,
} as any)
const AuthenticatedNotificationsRoute =
  AuthenticatedNotificationsRouteImport.update({
    id: '/notifications',
    path: '/notifications',
    getParentRoute: () => AuthenticatedRouteRoute,
  } as any)
const AuthenticatedSuperAdminRouteRoute =
  AuthenticatedSuperAdminRouteRouteImport.update({
    id: '/super-admin',
    path: '/super-admin',
    getParentRoute: () => AuthenticatedRouteRoute,
  } as any)
const AuthenticatedAdminRouteRoute = AuthenticatedAdminRouteRouteImport.update({
  id: '/admin',
  path: '/admin',
  getParentRoute: () => AuthenticatedRouteRoute,
} as any)
const AuthenticatedSuperAdminIndexRoute =
  AuthenticatedSuperAdminIndexRouteImport.update({
    id: '/',
    path: '/',
    getParentRoute: () => AuthenticatedSuperAdminRouteRoute,
  } as any)
const AuthenticatedAdminIndexRoute = AuthenticatedAdminIndexRouteImport.update({
  id: '/',
  path: '/',
  getParentRoute: () => AuthenticatedAdminRouteRoute,
} as any)
const ForumasTemaIdRoute = ForumasTemaIdRouteImport.update({
  id: '/tema/$id',
  path: '/tema/$id',
  getParentRoute: () => ForumasRoute,
} as any)
const AuthenticatedSuperAdminGrantsRoute =
  AuthenticatedSuperAdminGrantsRouteImport.update({
    id: '/grants',
    path: '/grants',
    getParentRoute: () => AuthenticatedSuperAdminRouteRoute,
  } as any)
const AuthenticatedSuperAdminFinanceRoute =
  AuthenticatedSuperAdminFinanceRouteImport.update({
    id: '/finance',
    path: '/finance',
    getParentRoute: () => AuthenticatedSuperAdminRouteRoute,
  } as any)
const AuthenticatedSuperAdminBroadcastRoute =
  AuthenticatedSuperAdminBroadcastRouteImport.update({
    id: '/broadcast',
    path: '/broadcast',
    getParentRoute: () => AuthenticatedSuperAdminRouteRoute,
  } as any)
const AuthenticatedSuperAdminBackupsRoute =
  AuthenticatedSuperAdminBackupsRouteImport.update({
    id: '/backups',
    path: '/backups',
    getParentRoute: () => AuthenticatedSuperAdminRouteRoute,
  } as any)
const AuthenticatedDashboardCustomerRoute =
  AuthenticatedDashboardCustomerRouteImport.update({
    id: '/dashboard/customer',
    path: '/dashboard/customer',
    getParentRoute: () => AuthenticatedRouteRoute,
  } as any)
const AuthenticatedDashboardB2bRoute =
  AuthenticatedDashboardB2bRouteImport.update({
    id: '/dashboard/b2b',
    path: '/dashboard/b2b',
    getParentRoute: () => AuthenticatedRouteRoute,
  } as any)
const AuthenticatedDashboardAddonsRoute =
  AuthenticatedDashboardAddonsRouteImport.update({
    id: '/dashboard/addons',
    path: '/dashboard/addons',
    getParentRoute: () => AuthenticatedRouteRoute,
  } as any)
const AuthenticatedAdminVerificationsRoute =
  AuthenticatedAdminVerificationsRouteImport.update({
    id: '/verifications',
    path: '/verifications',
    getParentRoute: () => AuthenticatedAdminRouteRoute,
  } as any)
const AuthenticatedAdminUsersRoute = AuthenticatedAdminUsersRouteImport.update({
  id: '/users',
  path: '/users',
  getParentRoute: () => AuthenticatedAdminRouteRoute,
} as any)
const AuthenticatedAdminSystemRoute =
  AuthenticatedAdminSystemRouteImport.update({
    id: '/system',
    path: '/system',
    getParentRoute: () => AuthenticatedAdminRouteRoute,
  } as any)
const AuthenticatedAdminSupplierRequestsRoute =
  AuthenticatedAdminSupplierRequestsRouteImport.update({
    id: '/supplier-requests',
    path: '/supplier-requests',
    getParentRoute: () => AuthenticatedAdminRouteRoute,
  } as any)
const AuthenticatedAdminSuggestionsRoute =
  AuthenticatedAdminSuggestionsRouteImport.update({
    id: '/suggestions',
    path: '/suggestions',
    getParentRoute: () => AuthenticatedAdminRouteRoute,
  } as any)
const AuthenticatedAdminSiteEditorRoute =
  AuthenticatedAdminSiteEditorRouteImport.update({
    id: '/site-editor',
    path: '/site-editor',
    getParentRoute: () => AuthenticatedAdminRouteRoute,
  } as any)
const AuthenticatedAdminPromotionsRoute =
  AuthenticatedAdminPromotionsRouteImport.update({
    id: '/promotions',
    path: '/promotions',
    getParentRoute: () => AuthenticatedAdminRouteRoute,
  } as any)
const AuthenticatedAdminMembershipsRoute =
  AuthenticatedAdminMembershipsRouteImport.update({
    id: '/memberships',
    path: '/memberships',
    getParentRoute: () => AuthenticatedAdminRouteRoute,
  } as any)
const AuthenticatedAdminContentRoute =
  AuthenticatedAdminContentRouteImport.update({
    id: '/content',
    path: '/content',
    getParentRoute: () => AuthenticatedAdminRouteRoute,
  } as any)
const AuthenticatedAdminCommentsRoute =
  AuthenticatedAdminCommentsRouteImport.update({
    id: '/comments',
    path: '/comments',
    getParentRoute: () => AuthenticatedAdminRouteRoute,
  } as any)
const AuthenticatedAdminCatalogRoute =
  AuthenticatedAdminCatalogRouteImport.update({
    id: '/catalog',
    path: '/catalog',
    getParentRoute: () => AuthenticatedAdminRouteRoute,
  } as any)
const AuthenticatedAdminAuditRoute = AuthenticatedAdminAuditRouteImport.update({
  id: '/audit',
  path: '/audit',
  getParentRoute: () => AuthenticatedAdminRouteRoute,
} as any)
const AuthenticatedAdminApprovalsRoute =
  AuthenticatedAdminApprovalsRouteImport.update({
    id: '/approvals',
    path: '/approvals',
    getParentRoute: () => AuthenticatedAdminRouteRoute,
  } as any)
const AuthenticatedAdminAppointmentsRoute =
  AuthenticatedAdminAppointmentsRouteImport.update({
    id: '/appointments',
    path: '/appointments',
    getParentRoute: () => AuthenticatedAdminRouteRoute,
  } as any)
const AuthenticatedAdminAdsRoute = AuthenticatedAdminAdsRouteImport.update({
  id: '/ads',
  path: '/ads',
  getParentRoute: () => AuthenticatedAdminRouteRoute,
} as any)
const ApiPublicWebhooksStripeRoute = ApiPublicWebhooksStripeRouteImport.update({
  id: '/api/public/webhooks/stripe',
  path: '/api/public/webhooks/stripe',
  getParentRoute: () => rootRouteImport,
} as any)
const AuthenticatedDashboardSupplierProfileRoute =
  AuthenticatedDashboardSupplierProfileRouteImport.update({
    id: '/dashboard/supplier/profile',
    path: '/dashboard/supplier/profile',
    getParentRoute: () => AuthenticatedRouteRoute,
  } as any)
const AuthenticatedDashboardSupplierProductsRoute =
  AuthenticatedDashboardSupplierProductsRouteImport.update({
    id: '/dashboard/supplier/products',
    path: '/dashboard/supplier/products',
    getParentRoute: () => AuthenticatedRouteRoute,
  } as any)
const AuthenticatedDashboardSupplierMembershipRoute =
  AuthenticatedDashboardSupplierMembershipRouteImport.update({
    id: '/dashboard/supplier/membership',
    path: '/dashboard/supplier/membership',
    getParentRoute: () => AuthenticatedRouteRoute,
  } as any)
const AuthenticatedDashboardSupplierFeedRoute =
  AuthenticatedDashboardSupplierFeedRouteImport.update({
    id: '/dashboard/supplier/feed',
    path: '/dashboard/supplier/feed',
    getParentRoute: () => AuthenticatedRouteRoute,
  } as any)
const AuthenticatedDashboardSupplierEventsRoute =
  AuthenticatedDashboardSupplierEventsRouteImport.update({
    id: '/dashboard/supplier/events',
    path: '/dashboard/supplier/events',
    getParentRoute: () => AuthenticatedRouteRoute,
  } as any)
const AuthenticatedDashboardSchoolRegistrationsRoute =
  AuthenticatedDashboardSchoolRegistrationsRouteImport.update({
    id: '/dashboard/school/registrations',
    path: '/dashboard/school/registrations',
    getParentRoute: () => AuthenticatedRouteRoute,
  } as any)
const AuthenticatedDashboardSchoolCoursesRoute =
  AuthenticatedDashboardSchoolCoursesRouteImport.update({
    id: '/dashboard/school/courses',
    path: '/dashboard/school/courses',
    getParentRoute: () => AuthenticatedRouteRoute,
  } as any)
const AuthenticatedDashboardSalonWalletRoute =
  AuthenticatedDashboardSalonWalletRouteImport.update({
    id: '/dashboard/salon/wallet',
    path: '/dashboard/salon/wallet',
    getParentRoute: () => AuthenticatedRouteRoute,
  } as any)
const AuthenticatedDashboardSalonVerificationRoute =
  AuthenticatedDashboardSalonVerificationRouteImport.update({
    id: '/dashboard/salon/verification',
    path: '/dashboard/salon/verification',
    getParentRoute: () => AuthenticatedRouteRoute,
  } as any)
const AuthenticatedDashboardSalonStaffRoute =
  AuthenticatedDashboardSalonStaffRouteImport.update({
    id: '/dashboard/salon/staff',
    path: '/dashboard/salon/staff',
    getParentRoute: () => AuthenticatedRouteRoute,
  } as any)
const AuthenticatedDashboardSalonServicesRoute =
  AuthenticatedDashboardSalonServicesRouteImport.update({
    id: '/dashboard/salon/services',
    path: '/dashboard/salon/services',
    getParentRoute: () => AuthenticatedRouteRoute,
  } as any)
const AuthenticatedDashboardSalonRentalsRoute =
  AuthenticatedDashboardSalonRentalsRouteImport.update({
    id: '/dashboard/salon/rentals',
    path: '/dashboard/salon/rentals',
    getParentRoute: () => AuthenticatedRouteRoute,
  } as any)
const AuthenticatedDashboardSalonPromoteRoute =
  AuthenticatedDashboardSalonPromoteRouteImport.update({
    id: '/dashboard/salon/promote',
    path: '/dashboard/salon/promote',
    getParentRoute: () => AuthenticatedRouteRoute,
  } as any)
const AuthenticatedDashboardSalonProfileRoute =
  AuthenticatedDashboardSalonProfileRouteImport.update({
    id: '/dashboard/salon/profile',
    path: '/dashboard/salon/profile',
    getParentRoute: () => AuthenticatedRouteRoute,
  } as any)
const AuthenticatedDashboardSalonOverviewRoute =
  AuthenticatedDashboardSalonOverviewRouteImport.update({
    id: '/dashboard/salon/overview',
    path: '/dashboard/salon/overview',
    getParentRoute: () => AuthenticatedRouteRoute,
  } as any)
const AuthenticatedDashboardSalonModelsRoute =
  AuthenticatedDashboardSalonModelsRouteImport.update({
    id: '/dashboard/salon/models',
    path: '/dashboard/salon/models',
    getParentRoute: () => AuthenticatedRouteRoute,
  } as any)
const AuthenticatedDashboardSalonMembershipRoute =
  AuthenticatedDashboardSalonMembershipRouteImport.update({
    id: '/dashboard/salon/membership',
    path: '/dashboard/salon/membership',
    getParentRoute: () => AuthenticatedRouteRoute,
  } as any)
const AuthenticatedDashboardSalonInquiriesRoute =
  AuthenticatedDashboardSalonInquiriesRouteImport.update({
    id: '/dashboard/salon/inquiries',
    path: '/dashboard/salon/inquiries',
    getParentRoute: () => AuthenticatedRouteRoute,
  } as any)
const AuthenticatedDashboardSalonFeaturedRoute =
  AuthenticatedDashboardSalonFeaturedRouteImport.update({
    id: '/dashboard/salon/featured',
    path: '/dashboard/salon/featured',
    getParentRoute: () => AuthenticatedRouteRoute,
  } as any)
const AuthenticatedDashboardSalonEventsRoute =
  AuthenticatedDashboardSalonEventsRouteImport.update({
    id: '/dashboard/salon/events',
    path: '/dashboard/salon/events',
    getParentRoute: () => AuthenticatedRouteRoute,
  } as any)
const AuthenticatedDashboardSalonContentRoute =
  AuthenticatedDashboardSalonContentRouteImport.update({
    id: '/dashboard/salon/content',
    path: '/dashboard/salon/content',
    getParentRoute: () => AuthenticatedRouteRoute,
  } as any)
const AuthenticatedDashboardSalonClientsRoute =
  AuthenticatedDashboardSalonClientsRouteImport.update({
    id: '/dashboard/salon/clients',
    path: '/dashboard/salon/clients',
    getParentRoute: () => AuthenticatedRouteRoute,
  } as any)
const AuthenticatedDashboardSalonCalendarRoute =
  AuthenticatedDashboardSalonCalendarRouteImport.update({
    id: '/dashboard/salon/calendar',
    path: '/dashboard/salon/calendar',
    getParentRoute: () => AuthenticatedRouteRoute,
  } as any)
const AuthenticatedDashboardSalonAppointmentsRoute =
  AuthenticatedDashboardSalonAppointmentsRouteImport.update({
    id: '/dashboard/salon/appointments',
    path: '/dashboard/salon/appointments',
    getParentRoute: () => AuthenticatedRouteRoute,
  } as any)
const AuthenticatedDashboardEmployerJobsRoute =
  AuthenticatedDashboardEmployerJobsRouteImport.update({
    id: '/dashboard/employer/jobs',
    path: '/dashboard/employer/jobs',
    getParentRoute: () => AuthenticatedRouteRoute,
  } as any)

export interface FileRoutesByFullPath {
  '/': typeof IndexRoute
  '/about': typeof AboutRoute
  '/auth': typeof AuthRoute
  '/contact': typeof ContactRoute
  '/darbas': typeof DarbasRouteWithChildren
  '/duk': typeof DukRoute
  '/for-business': typeof ForBusinessRoute
  '/for-suppliers': typeof ForSuppliersRoute
  '/forumas': typeof ForumasRouteWithChildren
  '/ieskomi-modeliai': typeof IeskomiModeliaiRoute
  '/megstami': typeof MegstamiRoute
  '/meistrai': typeof MeistraiRoute
  '/mokyklos': typeof MokyklosRouteWithChildren
  '/prekiniai-zenklai': typeof PrekiniaiZenklaiRoute
  '/pricing': typeof PricingRoute
  '/privatumas': typeof PrivatumasRoute
  '/salonai': typeof SalonaiRoute
  '/search': typeof SearchRoute
  '/skelbimai': typeof SkelbimaiRoute
  '/taisykles': typeof TaisyklesRoute
  '/tiekejai': typeof TiekejaiRoute
  '/admin': typeof AuthenticatedAdminRouteRouteWithChildren
  '/super-admin': typeof AuthenticatedSuperAdminRouteRouteWithChildren
  '/notifications': typeof AuthenticatedNotificationsRoute
  '/orders': typeof AuthenticatedOrdersRoute
  '/profile': typeof AuthenticatedProfileRoute
  '/push-tester': typeof AuthenticatedPushTesterRoute
  '/verslas': typeof AuthenticatedVerslasRoute
  '/appointment/$token': typeof AppointmentTokenRoute
  '/article/$slug': typeof ArticleSlugRoute
  '/darbas/$slug': typeof DarbasSlugRoute
  '/feed/akcijos': typeof FeedAkcijosRoute
  '/feed/patalpos': typeof FeedPatalposRoute
  '/feed/renginiai': typeof FeedRenginiaiRoute
  '/forumas/$slug': typeof ForumasSlugRoute
  '/mokyklos/$slug': typeof MokyklosSlugRoute
  '/salon/$id': typeof SalonIdRoute
  '/shop/$slug': typeof ShopSlugRoute
  '/shop/': typeof ShopIndexRoute
  '/admin/ads': typeof AuthenticatedAdminAdsRoute
  '/admin/appointments': typeof AuthenticatedAdminAppointmentsRoute
  '/admin/approvals': typeof AuthenticatedAdminApprovalsRoute
  '/admin/audit': typeof AuthenticatedAdminAuditRoute
  '/admin/catalog': typeof AuthenticatedAdminCatalogRoute
  '/admin/comments': typeof AuthenticatedAdminCommentsRoute
  '/admin/content': typeof AuthenticatedAdminContentRoute
  '/admin/memberships': typeof AuthenticatedAdminMembershipsRoute
  '/admin/promotions': typeof AuthenticatedAdminPromotionsRoute
  '/admin/site-editor': typeof AuthenticatedAdminSiteEditorRoute
  '/admin/suggestions': typeof AuthenticatedAdminSuggestionsRoute
  '/admin/supplier-requests': typeof AuthenticatedAdminSupplierRequestsRoute
  '/admin/system': typeof AuthenticatedAdminSystemRoute
  '/admin/users': typeof AuthenticatedAdminUsersRoute
  '/admin/verifications': typeof AuthenticatedAdminVerificationsRoute
  '/dashboard/addons': typeof AuthenticatedDashboardAddonsRoute
  '/dashboard/b2b': typeof AuthenticatedDashboardB2bRoute
  '/dashboard/customer': typeof AuthenticatedDashboardCustomerRoute
  '/super-admin/backups': typeof AuthenticatedSuperAdminBackupsRoute
  '/super-admin/broadcast': typeof AuthenticatedSuperAdminBroadcastRoute
  '/super-admin/finance': typeof AuthenticatedSuperAdminFinanceRoute
  '/super-admin/grants': typeof AuthenticatedSuperAdminGrantsRoute
  '/forumas/tema/$id': typeof ForumasTemaIdRoute
  '/admin/': typeof AuthenticatedAdminIndexRoute
  '/super-admin/': typeof AuthenticatedSuperAdminIndexRoute
  '/dashboard/employer/jobs': typeof AuthenticatedDashboardEmployerJobsRoute
  '/dashboard/salon/appointments': typeof AuthenticatedDashboardSalonAppointmentsRoute
  '/dashboard/salon/calendar': typeof AuthenticatedDashboardSalonCalendarRoute
  '/dashboard/salon/clients': typeof AuthenticatedDashboardSalonClientsRoute
  '/dashboard/salon/content': typeof AuthenticatedDashboardSalonContentRoute
  '/dashboard/salon/events': typeof AuthenticatedDashboardSalonEventsRoute
  '/dashboard/salon/featured': typeof AuthenticatedDashboardSalonFeaturedRoute
  '/dashboard/salon/inquiries': typeof AuthenticatedDashboardSalonInquiriesRoute
  '/dashboard/salon/membership': typeof AuthenticatedDashboardSalonMembershipRoute
  '/dashboard/salon/models': typeof AuthenticatedDashboardSalonModelsRoute
  '/dashboard/salon/overview': typeof AuthenticatedDashboardSalonOverviewRoute
  '/dashboard/salon/profile': typeof AuthenticatedDashboardSalonProfileRoute
  '/dashboard/salon/promote': typeof AuthenticatedDashboardSalonPromoteRoute
  '/dashboard/salon/rentals': typeof AuthenticatedDashboardSalonRentalsRoute
  '/dashboard/salon/services': typeof AuthenticatedDashboardSalonServicesRoute
  '/dashboard/salon/staff': typeof AuthenticatedDashboardSalonStaffRoute
  '/dashboard/salon/verification': typeof AuthenticatedDashboardSalonVerificationRoute
  '/dashboard/salon/wallet': typeof AuthenticatedDashboardSalonWalletRoute
  '/dashboard/school/courses': typeof AuthenticatedDashboardSchoolCoursesRoute
  '/dashboard/school/registrations': typeof AuthenticatedDashboardSchoolRegistrationsRoute
  '/dashboard/supplier/events': typeof AuthenticatedDashboardSupplierEventsRoute
  '/dashboard/supplier/feed': typeof AuthenticatedDashboardSupplierFeedRoute
  '/dashboard/supplier/membership': typeof AuthenticatedDashboardSupplierMembershipRoute
  '/dashboard/supplier/products': typeof AuthenticatedDashboardSupplierProductsRoute
  '/dashboard/supplier/profile': typeof AuthenticatedDashboardSupplierProfileRoute
  '/api/public/webhooks/stripe': typeof ApiPublicWebhooksStripeRoute
}
export interface FileRoutesByTo {
  '/': typeof IndexRoute
  '/about': typeof AboutRoute
  '/auth': typeof AuthRoute
  '/contact': typeof ContactRoute
  '/darbas': typeof DarbasRouteWithChildren
  '/duk': typeof DukRoute
  '/for-business': typeof ForBusinessRoute
  '/for-suppliers': typeof ForSuppliersRoute
  '/forumas': typeof ForumasRouteWithChildren
  '/ieskomi-modeliai': typeof IeskomiModeliaiRoute
  '/megstami': typeof MegstamiRoute
  '/meistrai': typeof MeistraiRoute
  '/mokyklos': typeof MokyklosRouteWithChildren
  '/prekiniai-zenklai': typeof PrekiniaiZenklaiRoute
  '/pricing': typeof PricingRoute
  '/privatumas': typeof PrivatumasRoute
  '/salonai': typeof SalonaiRoute
  '/search': typeof SearchRoute
  '/skelbimai': typeof SkelbimaiRoute
  '/taisykles': typeof TaisyklesRoute
  '/tiekejai': typeof TiekejaiRoute
  '/notifications': typeof AuthenticatedNotificationsRoute
  '/orders': typeof AuthenticatedOrdersRoute
  '/profile': typeof AuthenticatedProfileRoute
  '/push-tester': typeof AuthenticatedPushTesterRoute
  '/verslas': typeof AuthenticatedVerslasRoute
  '/appointment/$token': typeof AppointmentTokenRoute
  '/article/$slug': typeof ArticleSlugRoute
  '/darbas/$slug': typeof DarbasSlugRoute
  '/feed/akcijos': typeof FeedAkcijosRoute
  '/feed/patalpos': typeof FeedPatalposRoute
  '/feed/renginiai': typeof FeedRenginiaiRoute
  '/forumas/$slug': typeof ForumasSlugRoute
  '/mokyklos/$slug': typeof MokyklosSlugRoute
  '/salon/$id': typeof SalonIdRoute
  '/shop/$slug': typeof ShopSlugRoute
  '/shop': typeof ShopIndexRoute
  '/admin/ads': typeof AuthenticatedAdminAdsRoute
  '/admin/appointments': typeof AuthenticatedAdminAppointmentsRoute
  '/admin/approvals': typeof AuthenticatedAdminApprovalsRoute
  '/admin/audit': typeof AuthenticatedAdminAuditRoute
  '/admin/catalog': typeof AuthenticatedAdminCatalogRoute
  '/admin/comments': typeof AuthenticatedAdminCommentsRoute
  '/admin/content': typeof AuthenticatedAdminContentRoute
  '/admin/memberships': typeof AuthenticatedAdminMembershipsRoute
  '/admin/promotions': typeof AuthenticatedAdminPromotionsRoute
  '/admin/site-editor': typeof AuthenticatedAdminSiteEditorRoute
  '/admin/suggestions': typeof AuthenticatedAdminSuggestionsRoute
  '/admin/supplier-requests': typeof AuthenticatedAdminSupplierRequestsRoute
  '/admin/system': typeof AuthenticatedAdminSystemRoute
  '/admin/users': typeof AuthenticatedAdminUsersRoute
  '/admin/verifications': typeof AuthenticatedAdminVerificationsRoute
  '/dashboard/addons': typeof AuthenticatedDashboardAddonsRoute
  '/dashboard/b2b': typeof AuthenticatedDashboardB2bRoute
  '/dashboard/customer': typeof AuthenticatedDashboardCustomerRoute
  '/super-admin/backups': typeof AuthenticatedSuperAdminBackupsRoute
  '/super-admin/broadcast': typeof AuthenticatedSuperAdminBroadcastRoute
  '/super-admin/finance': typeof AuthenticatedSuperAdminFinanceRoute
  '/super-admin/grants': typeof AuthenticatedSuperAdminGrantsRoute
  '/forumas/tema/$id': typeof ForumasTemaIdRoute
  '/admin': typeof AuthenticatedAdminIndexRoute
  '/super-admin': typeof AuthenticatedSuperAdminIndexRoute
  '/dashboard/employer/jobs': typeof AuthenticatedDashboardEmployerJobsRoute
  '/dashboard/salon/appointments': typeof AuthenticatedDashboardSalonAppointmentsRoute
  '/dashboard/salon/calendar': typeof AuthenticatedDashboardSalonCalendarRoute
  '/dashboard/salon/clients': typeof AuthenticatedDashboardSalonClientsRoute
  '/dashboard/salon/content': typeof AuthenticatedDashboardSalonContentRoute
  '/dashboard/salon/events': typeof AuthenticatedDashboardSalonEventsRoute
  '/dashboard/salon/featured': typeof AuthenticatedDashboardSalonFeaturedRoute
  '/dashboard/salon/inquiries': typeof AuthenticatedDashboardSalonInquiriesRoute
  '/dashboard/salon/membership': typeof AuthenticatedDashboardSalonMembershipRoute
  '/dashboard/salon/models': typeof AuthenticatedDashboardSalonModelsRoute
  '/dashboard/salon/overview': typeof AuthenticatedDashboardSalonOverviewRoute
  '/dashboard/salon/profile': typeof AuthenticatedDashboardSalonProfileRoute
  '/dashboard/salon/promote': typeof AuthenticatedDashboardSalonPromoteRoute
  '/dashboard/salon/rentals': typeof AuthenticatedDashboardSalonRentalsRoute
  '/dashboard/salon/services': typeof AuthenticatedDashboardSalonServicesRoute
  '/dashboard/salon/staff': typeof AuthenticatedDashboardSalonStaffRoute
  '/dashboard/salon/verification': typeof AuthenticatedDashboardSalonVerificationRoute
  '/dashboard/salon/wallet': typeof AuthenticatedDashboardSalonWalletRoute
  '/dashboard/school/courses': typeof AuthenticatedDashboardSchoolCoursesRoute
  '/dashboard/school/registrations': typeof AuthenticatedDashboardSchoolRegistrationsRoute
  '/dashboard/supplier/events': typeof AuthenticatedDashboardSupplierEventsRoute
  '/dashboard/supplier/feed': typeof AuthenticatedDashboardSupplierFeedRoute
  '/dashboard/supplier/membership': typeof AuthenticatedDashboardSupplierMembershipRoute
  '/dashboard/supplier/products': typeof AuthenticatedDashboardSupplierProductsRoute
  '/dashboard/supplier/profile': typeof AuthenticatedDashboardSupplierProfileRoute
  '/api/public/webhooks/stripe': typeof ApiPublicWebhooksStripeRoute
}
export interface FileRoutesById {
  __root__: typeof rootRouteImport
  '/': typeof IndexRoute
  '/_authenticated': typeof AuthenticatedRouteRouteWithChildren
  '/about': typeof AboutRoute
  '/auth': typeof AuthRoute
  '/contact': typeof ContactRoute
  '/darbas': typeof DarbasRouteWithChildren
  '/duk': typeof DukRoute
  '/for-business': typeof ForBusinessRoute
  '/for-suppliers': typeof ForSuppliersRoute
  '/forumas': typeof ForumasRouteWithChildren
  '/ieskomi-modeliai': typeof IeskomiModeliaiRoute
  '/megstami': typeof MegstamiRoute
  '/meistrai': typeof MeistraiRoute
  '/mokyklos': typeof MokyklosRouteWithChildren
  '/prekiniai-zenklai': typeof PrekiniaiZenklaiRoute
  '/pricing': typeof PricingRoute
  '/privatumas': typeof PrivatumasRoute
  '/salonai': typeof SalonaiRoute
  '/search': typeof SearchRoute
  '/skelbimai': typeof SkelbimaiRoute
  '/taisykles': typeof TaisyklesRoute
  '/tiekejai': typeof TiekejaiRoute
  '/_authenticated/admin': typeof AuthenticatedAdminRouteRouteWithChildren
  '/_authenticated/super-admin': typeof AuthenticatedSuperAdminRouteRouteWithChildren
  '/_authenticated/notifications': typeof AuthenticatedNotificationsRoute
  '/_authenticated/orders': typeof AuthenticatedOrdersRoute
  '/_authenticated/profile': typeof AuthenticatedProfileRoute
  '/_authenticated/push-tester': typeof AuthenticatedPushTesterRoute
  '/_authenticated/verslas': typeof AuthenticatedVerslasRoute
  '/appointment/$token': typeof AppointmentTokenRoute
  '/article/$slug': typeof ArticleSlugRoute
  '/darbas/$slug': typeof DarbasSlugRoute
  '/feed/akcijos': typeof FeedAkcijosRoute
  '/feed/patalpos': typeof FeedPatalposRoute
  '/feed/renginiai': typeof FeedRenginiaiRoute
  '/forumas/$slug': typeof ForumasSlugRoute
  '/mokyklos/$slug': typeof MokyklosSlugRoute
  '/salon/$id': typeof SalonIdRoute
  '/shop/$slug': typeof ShopSlugRoute
  '/shop/': typeof ShopIndexRoute
  '/_authenticated/admin/ads': typeof AuthenticatedAdminAdsRoute
  '/_authenticated/admin/appointments': typeof AuthenticatedAdminAppointmentsRoute
  '/_authenticated/admin/approvals': typeof AuthenticatedAdminApprovalsRoute
  '/_authenticated/admin/audit': typeof AuthenticatedAdminAuditRoute
  '/_authenticated/admin/catalog': typeof AuthenticatedAdminCatalogRoute
  '/_authenticated/admin/comments': typeof AuthenticatedAdminCommentsRoute
  '/_authenticated/admin/content': typeof AuthenticatedAdminContentRoute
  '/_authenticated/admin/memberships': typeof AuthenticatedAdminMembershipsRoute
  '/_authenticated/admin/promotions': typeof AuthenticatedAdminPromotionsRoute
  '/_authenticated/admin/site-editor': typeof AuthenticatedAdminSiteEditorRoute
  '/_authenticated/admin/suggestions': typeof AuthenticatedAdminSuggestionsRoute
  '/_authenticated/admin/supplier-requests': typeof AuthenticatedAdminSupplierRequestsRoute
  '/_authenticated/admin/system': typeof AuthenticatedAdminSystemRoute
  '/_authenticated/admin/users': typeof AuthenticatedAdminUsersRoute
  '/_authenticated/admin/verifications': typeof AuthenticatedAdminVerificationsRoute
  '/_authenticated/dashboard/addons': typeof AuthenticatedDashboardAddonsRoute
  '/_authenticated/dashboard/b2b': typeof AuthenticatedDashboardB2bRoute
  '/_authenticated/dashboard/customer': typeof AuthenticatedDashboardCustomerRoute
  '/_authenticated/super-admin/backups': typeof AuthenticatedSuperAdminBackupsRoute
  '/_authenticated/super-admin/broadcast': typeof AuthenticatedSuperAdminBroadcastRoute
  '/_authenticated/super-admin/finance': typeof AuthenticatedSuperAdminFinanceRoute
  '/_authenticated/super-admin/grants': typeof AuthenticatedSuperAdminGrantsRoute
  '/forumas/tema/$id': typeof ForumasTemaIdRoute
  '/_authenticated/admin/': typeof AuthenticatedAdminIndexRoute
  '/_authenticated/super-admin/': typeof AuthenticatedSuperAdminIndexRoute
  '/_authenticated/dashboard/employer/jobs': typeof AuthenticatedDashboardEmployerJobsRoute
  '/_authenticated/dashboard/salon/appointments': typeof AuthenticatedDashboardSalonAppointmentsRoute
  '/_authenticated/dashboard/salon/calendar': typeof AuthenticatedDashboardSalonCalendarRoute
  '/_authenticated/dashboard/salon/clients': typeof AuthenticatedDashboardSalonClientsRoute
  '/_authenticated/dashboard/salon/content': typeof AuthenticatedDashboardSalonContentRoute
  '/_authenticated/dashboard/salon/events': typeof AuthenticatedDashboardSalonEventsRoute
  '/_authenticated/dashboard/salon/featured': typeof AuthenticatedDashboardSalonFeaturedRoute
  '/_authenticated/dashboard/salon/inquiries': typeof AuthenticatedDashboardSalonInquiriesRoute
  '/_authenticated/dashboard/salon/membership': typeof AuthenticatedDashboardSalonMembershipRoute
  '/_authenticated/dashboard/salon/models': typeof AuthenticatedDashboardSalonModelsRoute
  '/_authenticated/dashboard/salon/overview': typeof AuthenticatedDashboardSalonOverviewRoute
  '/_authenticated/dashboard/salon/profile': typeof AuthenticatedDashboardSalonProfileRoute
  '/_authenticated/dashboard/salon/promote': typeof AuthenticatedDashboardSalonPromoteRoute
  '/_authenticated/dashboard/salon/rentals': typeof AuthenticatedDashboardSalonRentalsRoute
  '/_authenticated/dashboard/salon/services': typeof AuthenticatedDashboardSalonServicesRoute
  '/_authenticated/dashboard/salon/staff': typeof AuthenticatedDashboardSalonStaffRoute
  '/_authenticated/dashboard/salon/verification': typeof AuthenticatedDashboardSalonVerificationRoute
  '/_authenticated/dashboard/salon/wallet': typeof AuthenticatedDashboardSalonWalletRoute
  '/_authenticated/dashboard/school/courses': typeof AuthenticatedDashboardSchoolCoursesRoute
  '/_authenticated/dashboard/school/registrations': typeof AuthenticatedDashboardSchoolRegistrationsRoute
  '/_authenticated/dashboard/supplier/events': typeof AuthenticatedDashboardSupplierEventsRoute
  '/_authenticated/dashboard/supplier/feed': typeof AuthenticatedDashboardSupplierFeedRoute
  '/_authenticated/dashboard/supplier/membership': typeof AuthenticatedDashboardSupplierMembershipRoute
  '/_authenticated/dashboard/supplier/products': typeof AuthenticatedDashboardSupplierProductsRoute
  '/_authenticated/dashboard/supplier/profile': typeof AuthenticatedDashboardSupplierProfileRoute
  '/api/public/webhooks/stripe': typeof ApiPublicWebhooksStripeRoute
}
export interface FileRouteTypes {
  fileRoutesByFullPath: FileRoutesByFullPath
  fullPaths:
    | '/'
    | '/about'
    | '/auth'
    | '/contact'
    | '/darbas'
    | '/duk'
    | '/for-business'
    | '/for-suppliers'
    | '/forumas'
    | '/ieskomi-modeliai'
    | '/megstami'
    | '/meistrai'
    | '/mokyklos'
    | '/prekiniai-zenklai'
    | '/pricing'
    | '/privatumas'
    | '/salonai'
    | '/search'
    | '/skelbimai'
    | '/taisykles'
    | '/tiekejai'
    | '/admin'
    | '/super-admin'
    | '/notifications'
    | '/orders'
    | '/profile'
    | '/push-tester'
    | '/verslas'
    | '/appointment/$token'
    | '/article/$slug'
    | '/darbas/$slug'
    | '/feed/akcijos'
    | '/feed/patalpos'
    | '/feed/renginiai'
    | '/forumas/$slug'
    | '/mokyklos/$slug'
    | '/salon/$id'
    | '/shop/$slug'
    | '/shop/'
    | '/admin/ads'
    | '/admin/appointments'
    | '/admin/approvals'
    | '/admin/audit'
    | '/admin/catalog'
    | '/admin/comments'
    | '/admin/content'
    | '/admin/memberships'
    | '/admin/promotions'
    | '/admin/site-editor'
    | '/admin/suggestions'
    | '/admin/supplier-requests'
    | '/admin/system'
    | '/admin/users'
    | '/admin/verifications'
    | '/dashboard/addons'
    | '/dashboard/b2b'
    | '/dashboard/customer'
    | '/super-admin/backups'
    | '/super-admin/broadcast'
    | '/super-admin/finance'
    | '/super-admin/grants'
    | '/forumas/tema/$id'
    | '/admin/'
    | '/super-admin/'
    | '/dashboard/employer/jobs'
    | '/dashboard/salon/appointments'
    | '/dashboard/salon/calendar'
    | '/dashboard/salon/clients'
    | '/dashboard/salon/content'
    | '/dashboard/salon/events'
    | '/dashboard/salon/featured'
    | '/dashboard/salon/inquiries'
    | '/dashboard/salon/membership'
    | '/dashboard/salon/models'
    | '/dashboard/salon/overview'
    | '/dashboard/salon/profile'
    | '/dashboard/salon/promote'
    | '/dashboard/salon/rentals'
    | '/dashboard/salon/services'
    | '/dashboard/salon/staff'
    | '/dashboard/salon/verification'
    | '/dashboard/salon/wallet'
    | '/dashboard/school/courses'
    | '/dashboard/school/registrations'
    | '/dashboard/supplier/events'
    | '/dashboard/supplier/feed'
    | '/dashboard/supplier/membership'
    | '/dashboard/supplier/products'
    | '/dashboard/supplier/profile'
    | '/api/public/webhooks/stripe'
  fileRoutesByTo: FileRoutesByTo
  to:
    | '/'
    | '/about'
    | '/auth'
    | '/contact'
    | '/darbas'
    | '/duk'
    | '/for-business'
    | '/for-suppliers'
    | '/forumas'
    | '/ieskomi-modeliai'
    | '/megstami'
    | '/meistrai'
    | '/mokyklos'
    | '/prekiniai-zenklai'
    | '/pricing'
    | '/privatumas'
    | '/salonai'
    | '/search'
    | '/skelbimai'
    | '/taisykles'
    | '/tiekejai'
    | '/notifications'
    | '/orders'
    | '/profile'
    | '/push-tester'
    | '/verslas'
    | '/appointment/$token'
    | '/article/$slug'
    | '/darbas/$slug'
    | '/feed/akcijos'
    | '/feed/patalpos'
    | '/feed/renginiai'
    | '/forumas/$slug'
    | '/mokyklos/$slug'
    | '/salon/$id'
    | '/shop/$slug'
    | '/shop'
    | '/admin/ads'
    | '/admin/appointments'
    | '/admin/approvals'
    | '/admin/audit'
    | '/admin/catalog'
    | '/admin/comments'
    | '/admin/content'
    | '/admin/memberships'
    | '/admin/promotions'
    | '/admin/site-editor'
    | '/admin/suggestions'
    | '/admin/supplier-requests'
    | '/admin/system'
    | '/admin/users'
    | '/admin/verifications'
    | '/dashboard/addons'
    | '/dashboard/b2b'
    | '/dashboard/customer'
    | '/super-admin/backups'
    | '/super-admin/broadcast'
    | '/super-admin/finance'
    | '/super-admin/grants'
    | '/forumas/tema/$id'
    | '/admin'
    | '/super-admin'
    | '/dashboard/employer/jobs'
    | '/dashboard/salon/appointments'
    | '/dashboard/salon/calendar'
    | '/dashboard/salon/clients'
    | '/dashboard/salon/content'
    | '/dashboard/salon/events'
    | '/dashboard/salon/featured'
    | '/dashboard/salon/inquiries'
    | '/dashboard/salon/membership'
    | '/dashboard/salon/models'
    | '/dashboard/salon/overview'
    | '/dashboard/salon/profile'
    | '/dashboard/salon/promote'
    | '/dashboard/salon/rentals'
    | '/dashboard/salon/services'
    | '/dashboard/salon/staff'
    | '/dashboard/salon/verification'
    | '/dashboard/salon/wallet'
    | '/dashboard/school/courses'
    | '/dashboard/school/registrations'
    | '/dashboard/supplier/events'
    | '/dashboard/supplier/feed'
    | '/dashboard/supplier/membership'
    | '/dashboard/supplier/products'
    | '/dashboard/supplier/profile'
    | '/api/public/webhooks/stripe'
  id:
    | '__root__'
    | '/'
    | '/_authenticated'
    | '/about'
    | '/auth'
    | '/contact'
    | '/darbas'
    | '/duk'
    | '/for-business'
    | '/for-suppliers'
    | '/forumas'
    | '/ieskomi-modeliai'
    | '/megstami'
    | '/meistrai'
    | '/mokyklos'
    | '/prekiniai-zenklai'
    | '/pricing'
    | '/privatumas'
    | '/salonai'
    | '/search'
    | '/skelbimai'
    | '/taisykles'
    | '/tiekejai'
    | '/_authenticated/admin'
    | '/_authenticated/super-admin'
    | '/_authenticated/notifications'
    | '/_authenticated/orders'
    | '/_authenticated/profile'
    | '/_authenticated/push-tester'
    | '/_authenticated/verslas'
    | '/appointment/$token'
    | '/article/$slug'
    | '/darbas/$slug'
    | '/feed/akcijos'
    | '/feed/patalpos'
    | '/feed/renginiai'
    | '/forumas/$slug'
    | '/mokyklos/$slug'
    | '/salon/$id'
    | '/shop/$slug'
    | '/shop/'
    | '/_authenticated/admin/ads'
    | '/_authenticated/admin/appointments'
    | '/_authenticated/admin/approvals'
    | '/_authenticated/admin/audit'
    | '/_authenticated/admin/catalog'
    | '/_authenticated/admin/comments'
    | '/_authenticated/admin/content'
    | '/_authenticated/admin/memberships'
    | '/_authenticated/admin/promotions'
    | '/_authenticated/admin/site-editor'
    | '/_authenticated/admin/suggestions'
    | '/_authenticated/admin/supplier-requests'
    | '/_authenticated/admin/system'
    | '/_authenticated/admin/users'
    | '/_authenticated/admin/verifications'
    | '/_authenticated/dashboard/addons'
    | '/_authenticated/dashboard/b2b'
    | '/_authenticated/dashboard/customer'
    | '/_authenticated/super-admin/backups'
    | '/_authenticated/super-admin/broadcast'
    | '/_authenticated/super-admin/finance'
    | '/_authenticated/super-admin/grants'
    | '/forumas/tema/$id'
    | '/_authenticated/admin/'
    | '/_authenticated/super-admin/'
    | '/_authenticated/dashboard/employer/jobs'
    | '/_authenticated/dashboard/salon/appointments'
    | '/_authenticated/dashboard/salon/calendar'
    | '/_authenticated/dashboard/salon/clients'
    | '/_authenticated/dashboard/salon/content'
    | '/_authenticated/dashboard/salon/events'
    | '/_authenticated/dashboard/salon/featured'
    | '/_authenticated/dashboard/salon/inquiries'
    | '/_authenticated/dashboard/salon/membership'
    | '/_authenticated/dashboard/salon/models'
    | '/_authenticated/dashboard/salon/overview'
    | '/_authenticated/dashboard/salon/profile'
    | '/_authenticated/dashboard/salon/promote'
    | '/_authenticated/dashboard/salon/rentals'
    | '/_authenticated/dashboard/salon/services'
    | '/_authenticated/dashboard/salon/staff'
    | '/_authenticated/dashboard/salon/verification'
    | '/_authenticated/dashboard/salon/wallet'
    | '/_authenticated/dashboard/school/courses'
    | '/_authenticated/dashboard/school/registrations'
    | '/_authenticated/dashboard/supplier/events'
    | '/_authenticated/dashboard/supplier/feed'
    | '/_authenticated/dashboard/supplier/membership'
    | '/_authenticated/dashboard/supplier/products'
    | '/_authenticated/dashboard/supplier/profile'
    | '/api/public/webhooks/stripe'
  fileRoutesById: FileRoutesById
}
export interface RootRouteChildren {
  IndexRoute: typeof IndexRoute
  AuthenticatedRouteRoute: typeof AuthenticatedRouteRouteWithChildren
  AboutRoute: typeof AboutRoute
  AuthRoute: typeof AuthRoute
  ContactRoute: typeof ContactRoute
  DarbasRoute: typeof DarbasRouteWithChildren
  DukRoute: typeof DukRoute
  ForBusinessRoute: typeof ForBusinessRoute
  ForSuppliersRoute: typeof ForSuppliersRoute
  ForumasRoute: typeof ForumasRouteWithChildren
  IeskomiModeliaiRoute: typeof IeskomiModeliaiRoute
  MegstamiRoute: typeof MegstamiRoute
  MeistraiRoute: typeof MeistraiRoute
  MokyklosRoute: typeof MokyklosRouteWithChildren
  PrekiniaiZenklaiRoute: typeof PrekiniaiZenklaiRoute
  PricingRoute: typeof PricingRoute
  PrivatumasRoute: typeof PrivatumasRoute
  SalonaiRoute: typeof SalonaiRoute
  SearchRoute: typeof SearchRoute
  SkelbimaiRoute: typeof SkelbimaiRoute
  TaisyklesRoute: typeof TaisyklesRoute
  TiekejaiRoute: typeof TiekejaiRoute
  AppointmentTokenRoute: typeof AppointmentTokenRoute
  ArticleSlugRoute: typeof ArticleSlugRoute
  FeedAkcijosRoute: typeof FeedAkcijosRoute
  FeedPatalposRoute: typeof FeedPatalposRoute
  FeedRenginiaiRoute: typeof FeedRenginiaiRoute
  SalonIdRoute: typeof SalonIdRoute
  ShopSlugRoute: typeof ShopSlugRoute
  ShopIndexRoute: typeof ShopIndexRoute
  ApiPublicWebhooksStripeRoute: typeof ApiPublicWebhooksStripeRoute
}

declare module '@tanstack/react-router' {
  interface FileRoutesByPath {
    '/tiekejai': {
      id: '/tiekejai'
      path: '/tiekejai'
      fullPath: '/tiekejai'
      preLoaderRoute: typeof TiekejaiRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/taisykles': {
      id: '/taisykles'
      path: '/taisykles'
      fullPath: '/taisykles'
      preLoaderRoute: typeof TaisyklesRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/skelbimai': {
      id: '/skelbimai'
      path: '/skelbimai'
      fullPath: '/skelbimai'
      preLoaderRoute: typeof SkelbimaiRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/search': {
      id: '/search'
      path: '/search'
      fullPath: '/search'
      preLoaderRoute: typeof SearchRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/salonai': {
      id: '/salonai'
      path: '/salonai'
      fullPath: '/salonai'
      preLoaderRoute: typeof SalonaiRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/privatumas': {
      id: '/privatumas'
      path: '/privatumas'
      fullPath: '/privatumas'
      preLoaderRoute: typeof PrivatumasRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/pricing': {
      id: '/pricing'
      path: '/pricing'
      fullPath: '/pricing'
      preLoaderRoute: typeof PricingRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/prekiniai-zenklai': {
      id: '/prekiniai-zenklai'
      path: '/prekiniai-zenklai'
      fullPath: '/prekiniai-zenklai'
      preLoaderRoute: typeof PrekiniaiZenklaiRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/mokyklos': {
      id: '/mokyklos'
      path: '/mokyklos'
      fullPath: '/mokyklos'
      preLoaderRoute: typeof MokyklosRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/meistrai': {
      id: '/meistrai'
      path: '/meistrai'
      fullPath: '/meistrai'
      preLoaderRoute: typeof MeistraiRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/megstami': {
      id: '/megstami'
      path: '/megstami'
      fullPath: '/megstami'
      preLoaderRoute: typeof MegstamiRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/ieskomi-modeliai': {
      id: '/ieskomi-modeliai'
      path: '/ieskomi-modeliai'
      fullPath: '/ieskomi-modeliai'
      preLoaderRoute: typeof IeskomiModeliaiRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/forumas': {
      id: '/forumas'
      path: '/forumas'
      fullPath: '/forumas'
      preLoaderRoute: typeof ForumasRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/for-suppliers': {
      id: '/for-suppliers'
      path: '/for-suppliers'
      fullPath: '/for-suppliers'
      preLoaderRoute: typeof ForSuppliersRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/for-business': {
      id: '/for-business'
      path: '/for-business'
      fullPath: '/for-business'
      preLoaderRoute: typeof ForBusinessRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/duk': {
      id: '/duk'
      path: '/duk'
      fullPath: '/duk'
      preLoaderRoute: typeof DukRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/darbas': {
      id: '/darbas'
      path: '/darbas'
      fullPath: '/darbas'
      preLoaderRoute: typeof DarbasRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/contact': {
      id: '/contact'
      path: '/contact'
      fullPath: '/contact'
      preLoaderRoute: typeof ContactRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/auth': {
      id: '/auth'
      path: '/auth'
      fullPath: '/auth'
      preLoaderRoute: typeof AuthRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/about': {
      id: '/about'
      path: '/about'
      fullPath: '/about'
      preLoaderRoute: typeof AboutRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/_authenticated': {
      id: '/_authenticated'
      path: ''
      fullPath: '/'
      preLoaderRoute: typeof AuthenticatedRouteRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/': {
      id: '/'
      path: '/'
      fullPath: '/'
      preLoaderRoute: typeof IndexRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/shop/': {
      id: '/shop/'
      path: '/shop'
      fullPath: '/shop/'
      preLoaderRoute: typeof ShopIndexRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/shop/$slug': {
      id: '/shop/$slug'
      path: '/shop/$slug'
      fullPath: '/shop/$slug'
      preLoaderRoute: typeof ShopSlugRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/salon/$id': {
      id: '/salon/$id'
      path: '/salon/$id'
      fullPath: '/salon/$id'
      preLoaderRoute: typeof SalonIdRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/mokyklos/$slug': {
      id: '/mokyklos/$slug'
      path: '/$slug'
      fullPath: '/mokyklos/$slug'
      preLoaderRoute: typeof MokyklosSlugRouteImport
      parentRoute: typeof MokyklosRoute
    }
    '/forumas/$slug': {
      id: '/forumas/$slug'
      path: '/$slug'
      fullPath: '/forumas/$slug'
      preLoaderRoute: typeof ForumasSlugRouteImport
      parentRoute: typeof ForumasRoute
    }
    '/feed/renginiai': {
      id: '/feed/renginiai'
      path: '/feed/renginiai'
      fullPath: '/feed/renginiai'
      preLoaderRoute: typeof FeedRenginiaiRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/feed/patalpos': {
      id: '/feed/patalpos'
      path: '/feed/patalpos'
      fullPath: '/feed/patalpos'
      preLoaderRoute: typeof FeedPatalposRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/feed/akcijos': {
      id: '/feed/akcijos'
      path: '/feed/akcijos'
      fullPath: '/feed/akcijos'
      preLoaderRoute: typeof FeedAkcijosRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/darbas/$slug': {
      id: '/darbas/$slug'
      path: '/$slug'
      fullPath: '/darbas/$slug'
      preLoaderRoute: typeof DarbasSlugRouteImport
      parentRoute: typeof DarbasRoute
    }
    '/article/$slug': {
      id: '/article/$slug'
      path: '/article/$slug'
      fullPath: '/article/$slug'
      preLoaderRoute: typeof ArticleSlugRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/appointment/$token': {
      id: '/appointment/$token'
      path: '/appointment/$token'
      fullPath: '/appointment/$token'
      preLoaderRoute: typeof AppointmentTokenRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/_authenticated/verslas': {
      id: '/_authenticated/verslas'
      path: '/verslas'
      fullPath: '/verslas'
      preLoaderRoute: typeof AuthenticatedVerslasRouteImport
      parentRoute: typeof AuthenticatedRouteRoute
    }
    '/_authenticated/push-tester': {
      id: '/_authenticated/push-tester'
      path: '/push-tester'
      fullPath: '/push-tester'
      preLoaderRoute: typeof AuthenticatedPushTesterRouteImport
      parentRoute: typeof AuthenticatedRouteRoute
    }
    '/_authenticated/profile': {
      id: '/_authenticated/profile'
      path: '/profile'
      fullPath: '/profile'
      preLoaderRoute: typeof AuthenticatedProfileRouteImport
      parentRoute: typeof AuthenticatedRouteRoute
    }
    '/_authenticated/orders': {
      id: '/_authenticated/orders'
      path: '/orders'
      fullPath: '/orders'
      preLoaderRoute: typeof AuthenticatedOrdersRouteImport
      parentRoute: typeof AuthenticatedRouteRoute
    }
    '/_authenticated/notifications': {
      id: '/_authenticated/notifications'
      path: '/notifications'
      fullPath: '/notifications'
      preLoaderRoute: typeof AuthenticatedNotificationsRouteImport
      parentRoute: typeof AuthenticatedRouteRoute
    }
    '/_authenticated/super-admin': {
      id: '/_authenticated/super-admin'
      path: '/super-admin'
      fullPath: '/super-admin'
      preLoaderRoute: typeof AuthenticatedSuperAdminRouteRouteImport
      parentRoute: typeof AuthenticatedRouteRoute
    }
    '/_authenticated/admin': {
      id: '/_authenticated/admin'
      path: '/admin'
      fullPath: '/admin'
      preLoaderRoute: typeof AuthenticatedAdminRouteRouteImport
      parentRoute: typeof AuthenticatedRouteRoute
    }
    '/_authenticated/super-admin/': {
      id: '/_authenticated/super-admin/'
      path: '/'
      fullPath: '/super-admin/'
      preLoaderRoute: typeof AuthenticatedSuperAdminIndexRouteImport
      parentRoute: typeof AuthenticatedSuperAdminRouteRoute
    }
    '/_authenticated/admin/': {
      id: '/_authenticated/admin/'
      path: '/'
      fullPath: '/admin/'
      preLoaderRoute: typeof AuthenticatedAdminIndexRouteImport
      parentRoute: typeof AuthenticatedAdminRouteRoute
    }
    '/forumas/tema/$id': {
      id: '/forumas/tema/$id'
      path: '/tema/$id'
      fullPath: '/forumas/tema/$id'
      preLoaderRoute: typeof ForumasTemaIdRouteImport
      parentRoute: typeof ForumasRoute
    }
    '/_authenticated/super-admin/grants': {
      id: '/_authenticated/super-admin/grants'
      path: '/grants'
      fullPath: '/super-admin/grants'
      preLoaderRoute: typeof AuthenticatedSuperAdminGrantsRouteImport
      parentRoute: typeof AuthenticatedSuperAdminRouteRoute
    }
    '/_authenticated/super-admin/finance': {
      id: '/_authenticated/super-admin/finance'
      path: '/finance'
      fullPath: '/super-admin/finance'
      preLoaderRoute: typeof AuthenticatedSuperAdminFinanceRouteImport
      parentRoute: typeof AuthenticatedSuperAdminRouteRoute
    }
    '/_authenticated/super-admin/broadcast': {
      id: '/_authenticated/super-admin/broadcast'
      path: '/broadcast'
      fullPath: '/super-admin/broadcast'
      preLoaderRoute: typeof AuthenticatedSuperAdminBroadcastRouteImport
      parentRoute: typeof AuthenticatedSuperAdminRouteRoute
    }
    '/_authenticated/super-admin/backups': {
      id: '/_authenticated/super-admin/backups'
      path: '/backups'
      fullPath: '/super-admin/backups'
      preLoaderRoute: typeof AuthenticatedSuperAdminBackupsRouteImport
      parentRoute: typeof AuthenticatedSuperAdminRouteRoute
    }
    '/_authenticated/dashboard/customer': {
      id: '/_authenticated/dashboard/customer'
      path: '/dashboard/customer'
      fullPath: '/dashboard/customer'
      preLoaderRoute: typeof AuthenticatedDashboardCustomerRouteImport
      parentRoute: typeof AuthenticatedRouteRoute
    }
    '/_authenticated/dashboard/b2b': {
      id: '/_authenticated/dashboard/b2b'
      path: '/dashboard/b2b'
      fullPath: '/dashboard/b2b'
      preLoaderRoute: typeof AuthenticatedDashboardB2bRouteImport
      parentRoute: typeof AuthenticatedRouteRoute
    }
    '/_authenticated/dashboard/addons': {
      id: '/_authenticated/dashboard/addons'
      path: '/dashboard/addons'
      fullPath: '/dashboard/addons'
      preLoaderRoute: typeof AuthenticatedDashboardAddonsRouteImport
      parentRoute: typeof AuthenticatedRouteRoute
    }
    '/_authenticated/admin/verifications': {
      id: '/_authenticated/admin/verifications'
      path: '/verifications'
      fullPath: '/admin/verifications'
      preLoaderRoute: typeof AuthenticatedAdminVerificationsRouteImport
      parentRoute: typeof AuthenticatedAdminRouteRoute
    }
    '/_authenticated/admin/users': {
      id: '/_authenticated/admin/users'
      path: '/users'
      fullPath: '/admin/users'
      preLoaderRoute: typeof AuthenticatedAdminUsersRouteImport
      parentRoute: typeof AuthenticatedAdminRouteRoute
    }
    '/_authenticated/admin/system': {
      id: '/_authenticated/admin/system'
      path: '/system'
      fullPath: '/admin/system'
      preLoaderRoute: typeof AuthenticatedAdminSystemRouteImport
      parentRoute: typeof AuthenticatedAdminRouteRoute
    }
    '/_authenticated/admin/supplier-requests': {
      id: '/_authenticated/admin/supplier-requests'
      path: '/supplier-requests'
      fullPath: '/admin/supplier-requests'
      preLoaderRoute: typeof AuthenticatedAdminSupplierRequestsRouteImport
      parentRoute: typeof AuthenticatedAdminRouteRoute
    }
    '/_authenticated/admin/suggestions': {
      id: '/_authenticated/admin/suggestions'
      path: '/suggestions'
      fullPath: '/admin/suggestions'
      preLoaderRoute: typeof AuthenticatedAdminSuggestionsRouteImport
      parentRoute: typeof AuthenticatedAdminRouteRoute
    }
    '/_authenticated/admin/site-editor': {
      id: '/_authenticated/admin/site-editor'
      path: '/site-editor'
      fullPath: '/admin/site-editor'
      preLoaderRoute: typeof AuthenticatedAdminSiteEditorRouteImport
      parentRoute: typeof AuthenticatedAdminRouteRoute
    }
    '/_authenticated/admin/promotions': {
      id: '/_authenticated/admin/promotions'
      path: '/promotions'
      fullPath: '/admin/promotions'
      preLoaderRoute: typeof AuthenticatedAdminPromotionsRouteImport
      parentRoute: typeof AuthenticatedAdminRouteRoute
    }
    '/_authenticated/admin/memberships': {
      id: '/_authenticated/admin/memberships'
      path: '/memberships'
      fullPath: '/admin/memberships'
      preLoaderRoute: typeof AuthenticatedAdminMembershipsRouteImport
      parentRoute: typeof AuthenticatedAdminRouteRoute
    }
    '/_authenticated/admin/content': {
      id: '/_authenticated/admin/content'
      path: '/content'
      fullPath: '/admin/content'
      preLoaderRoute: typeof AuthenticatedAdminContentRouteImport
      parentRoute: typeof AuthenticatedAdminRouteRoute
    }
    '/_authenticated/admin/comments': {
      id: '/_authenticated/admin/comments'
      path: '/comments'
      fullPath: '/admin/comments'
      preLoaderRoute: typeof AuthenticatedAdminCommentsRouteImport
      parentRoute: typeof AuthenticatedAdminRouteRoute
    }
    '/_authenticated/admin/catalog': {
      id: '/_authenticated/admin/catalog'
      path: '/catalog'
      fullPath: '/admin/catalog'
      preLoaderRoute: typeof AuthenticatedAdminCatalogRouteImport
      parentRoute: typeof AuthenticatedAdminRouteRoute
    }
    '/_authenticated/admin/audit': {
      id: '/_authenticated/admin/audit'
      path: '/audit'
      fullPath: '/admin/audit'
      preLoaderRoute: typeof AuthenticatedAdminAuditRouteImport
      parentRoute: typeof AuthenticatedAdminRouteRoute
    }
    '/_authenticated/admin/approvals': {
      id: '/_authenticated/admin/approvals'
      path: '/approvals'
      fullPath: '/admin/approvals'
      preLoaderRoute: typeof AuthenticatedAdminApprovalsRouteImport
      parentRoute: typeof AuthenticatedAdminRouteRoute
    }
    '/_authenticated/admin/appointments': {
      id: '/_authenticated/admin/appointments'
      path: '/appointments'
      fullPath: '/admin/appointments'
      preLoaderRoute: typeof AuthenticatedAdminAppointmentsRouteImport
      parentRoute: typeof AuthenticatedAdminRouteRoute
    }
    '/_authenticated/admin/ads': {
      id: '/_authenticated/admin/ads'
      path: '/ads'
      fullPath: '/admin/ads'
      preLoaderRoute: typeof AuthenticatedAdminAdsRouteImport
      parentRoute: typeof AuthenticatedAdminRouteRoute
    }
    '/api/public/webhooks/stripe': {
      id: '/api/public/webhooks/stripe'
      path: '/api/public/webhooks/stripe'
      fullPath: '/api/public/webhooks/stripe'
      preLoaderRoute: typeof ApiPublicWebhooksStripeRouteImport
      parentRoute: typeof rootRouteImport
    }
    '/_authenticated/dashboard/supplier/profile': {
      id: '/_authenticated/dashboard/supplier/profile'
      path: '/dashboard/supplier/profile'
      fullPath: '/dashboard/supplier/profile'
      preLoaderRoute: typeof AuthenticatedDashboardSupplierProfileRouteImport
      parentRoute: typeof AuthenticatedRouteRoute
    }
    '/_authenticated/dashboard/supplier/products': {
      id: '/_authenticated/dashboard/supplier/products'
      path: '/dashboard/supplier/products'
      fullPath: '/dashboard/supplier/products'
      preLoaderRoute: typeof AuthenticatedDashboardSupplierProductsRouteImport
      parentRoute: typeof AuthenticatedRouteRoute
    }
    '/_authenticated/dashboard/supplier/membership': {
      id: '/_authenticated/dashboard/supplier/membership'
      path: '/dashboard/supplier/membership'
      fullPath: '/dashboard/supplier/membership'
      preLoaderRoute: typeof AuthenticatedDashboardSupplierMembershipRouteImport
      parentRoute: typeof AuthenticatedRouteRoute
    }
    '/_authenticated/dashboard/supplier/feed': {
      id: '/_authenticated/dashboard/supplier/feed'
      path: '/dashboard/supplier/feed'
      fullPath: '/dashboard/supplier/feed'
      preLoaderRoute: typeof AuthenticatedDashboardSupplierFeedRouteImport
      parentRoute: typeof AuthenticatedRouteRoute
    }
    '/_authenticated/dashboard/supplier/events': {
      id: '/_authenticated/dashboard/supplier/events'
      path: '/dashboard/supplier/events'
      fullPath: '/dashboard/supplier/events'
      preLoaderRoute: typeof AuthenticatedDashboardSupplierEventsRouteImport
      parentRoute: typeof AuthenticatedRouteRoute
    }
    '/_authenticated/dashboard/school/registrations': {
      id: '/_authenticated/dashboard/school/registrations'
      path: '/dashboard/school/registrations'
      fullPath: '/dashboard/school/registrations'
      preLoaderRoute: typeof AuthenticatedDashboardSchoolRegistrationsRouteImport
      parentRoute: typeof AuthenticatedRouteRoute
    }
    '/_authenticated/dashboard/school/courses': {
      id: '/_authenticated/dashboard/school/courses'
      path: '/dashboard/school/courses'
      fullPath: '/dashboard/school/courses'
      preLoaderRoute: typeof AuthenticatedDashboardSchoolCoursesRouteImport
      parentRoute: typeof AuthenticatedRouteRoute
    }
    '/_authenticated/dashboard/salon/wallet': {
      id: '/_authenticated/dashboard/salon/wallet'
      path: '/dashboard/salon/wallet'
      fullPath: '/dashboard/salon/wallet'
      preLoaderRoute: typeof AuthenticatedDashboardSalonWalletRouteImport
      parentRoute: typeof AuthenticatedRouteRoute
    }
    '/_authenticated/dashboard/salon/verification': {
      id: '/_authenticated/dashboard/salon/verification'
      path: '/dashboard/salon/verification'
      fullPath: '/dashboard/salon/verification'
      preLoaderRoute: typeof AuthenticatedDashboardSalonVerificationRouteImport
      parentRoute: typeof AuthenticatedRouteRoute
    }
    '/_authenticated/dashboard/salon/staff': {
      id: '/_authenticated/dashboard/salon/staff'
      path: '/dashboard/salon/staff'
      fullPath: '/dashboard/salon/staff'
      preLoaderRoute: typeof AuthenticatedDashboardSalonStaffRouteImport
      parentRoute: typeof AuthenticatedRouteRoute
    }
    '/_authenticated/dashboard/salon/services': {
      id: '/_authenticated/dashboard/salon/services'
      path: '/dashboard/salon/services'
      fullPath: '/dashboard/salon/services'
      preLoaderRoute: typeof AuthenticatedDashboardSalonServicesRouteImport
      parentRoute: typeof AuthenticatedRouteRoute
    }
    '/_authenticated/dashboard/salon/rentals': {
      id: '/_authenticated/dashboard/salon/rentals'
      path: '/dashboard/salon/rentals'
      fullPath: '/dashboard/salon/rentals'
      preLoaderRoute: typeof AuthenticatedDashboardSalonRentalsRouteImport
      parentRoute: typeof AuthenticatedRouteRoute
    }
    '/_authenticated/dashboard/salon/promote': {
      id: '/_authenticated/dashboard/salon/promote'
      path: '/dashboard/salon/promote'
      fullPath: '/dashboard/salon/promote'
      preLoaderRoute: typeof AuthenticatedDashboardSalonPromoteRouteImport
      parentRoute: typeof AuthenticatedRouteRoute
    }
    '/_authenticated/dashboard/salon/profile': {
      id: '/_authenticated/dashboard/salon/profile'
      path: '/dashboard/salon/profile'
      fullPath: '/dashboard/salon/profile'
      preLoaderRoute: typeof AuthenticatedDashboardSalonProfileRouteImport
      parentRoute: typeof AuthenticatedRouteRoute
    }
    '/_authenticated/dashboard/salon/overview': {
      id: '/_authenticated/dashboard/salon/overview'
      path: '/dashboard/salon/overview'
      fullPath: '/dashboard/salon/overview'
      preLoaderRoute: typeof AuthenticatedDashboardSalonOverviewRouteImport
      parentRoute: typeof AuthenticatedRouteRoute
    }
    '/_authenticated/dashboard/salon/models': {
      id: '/_authenticated/dashboard/salon/models'
      path: '/dashboard/salon/models'
      fullPath: '/dashboard/salon/models'
      preLoaderRoute: typeof AuthenticatedDashboardSalonModelsRouteImport
      parentRoute: typeof AuthenticatedRouteRoute
    }
    '/_authenticated/dashboard/salon/membership': {
      id: '/_authenticated/dashboard/salon/membership'
      path: '/dashboard/salon/membership'
      fullPath: '/dashboard/salon/membership'
      preLoaderRoute: typeof AuthenticatedDashboardSalonMembershipRouteImport
      parentRoute: typeof AuthenticatedRouteRoute
    }
    '/_authenticated/dashboard/salon/inquiries': {
      id: '/_authenticated/dashboard/salon/inquiries'
      path: '/dashboard/salon/inquiries'
      fullPath: '/dashboard/salon/inquiries'
      preLoaderRoute: typeof AuthenticatedDashboardSalonInquiriesRouteImport
      parentRoute: typeof AuthenticatedRouteRoute
    }
    '/_authenticated/dashboard/salon/featured': {
      id: '/_authenticated/dashboard/salon/featured'
      path: '/dashboard/salon/featured'
      fullPath: '/dashboard/salon/featured'
      preLoaderRoute: typeof AuthenticatedDashboardSalonFeaturedRouteImport
      parentRoute: typeof AuthenticatedRouteRoute
    }
    '/_authenticated/dashboard/salon/events': {
      id: '/_authenticated/dashboard/salon/events'
      path: '/dashboard/salon/events'
      fullPath: '/dashboard/salon/events'
      preLoaderRoute: typeof AuthenticatedDashboardSalonEventsRouteImport
      parentRoute: typeof AuthenticatedRouteRoute
    }
    '/_authenticated/dashboard/salon/content': {
      id: '/_authenticated/dashboard/salon/content'
      path: '/dashboard/salon/content'
      fullPath: '/dashboard/salon/content'
      preLoaderRoute: typeof AuthenticatedDashboardSalonContentRouteImport
      parentRoute: typeof AuthenticatedRouteRoute
    }
    '/_authenticated/dashboard/salon/clients': {
      id: '/_authenticated/dashboard/salon/clients'
      path: '/dashboard/salon/clients'
      fullPath: '/dashboard/salon/clients'
      preLoaderRoute: typeof AuthenticatedDashboardSalonClientsRouteImport
      parentRoute: typeof AuthenticatedRouteRoute
    }
    '/_authenticated/dashboard/salon/calendar': {
      id: '/_authenticated/dashboard/salon/calendar'
      path: '/dashboard/salon/calendar'
      fullPath: '/dashboard/salon/calendar'
      preLoaderRoute: typeof AuthenticatedDashboardSalonCalendarRouteImport
      parentRoute: typeof AuthenticatedRouteRoute
    }
    '/_authenticated/dashboard/salon/appointments': {
      id: '/_authenticated/dashboard/salon/appointments'
      path: '/dashboard/salon/appointments'
      fullPath: '/dashboard/salon/appointments'
      preLoaderRoute: typeof AuthenticatedDashboardSalonAppointmentsRouteImport
      parentRoute: typeof AuthenticatedRouteRoute
    }
    '/_authenticated/dashboard/employer/jobs': {
      id: '/_authenticated/dashboard/employer/jobs'
      path: '/dashboard/employer/jobs'
      fullPath: '/dashboard/employer/jobs'
      preLoaderRoute: typeof AuthenticatedDashboardEmployerJobsRouteImport
      parentRoute: typeof AuthenticatedRouteRoute
    }
  }
}

interface AuthenticatedAdminRouteRouteChildren {
  AuthenticatedAdminAdsRoute: typeof AuthenticatedAdminAdsRoute
  AuthenticatedAdminAppointmentsRoute: typeof AuthenticatedAdminAppointmentsRoute
  AuthenticatedAdminApprovalsRoute: typeof AuthenticatedAdminApprovalsRoute
  AuthenticatedAdminAuditRoute: typeof AuthenticatedAdminAuditRoute
  AuthenticatedAdminCatalogRoute: typeof AuthenticatedAdminCatalogRoute
  AuthenticatedAdminCommentsRoute: typeof AuthenticatedAdminCommentsRoute
  AuthenticatedAdminContentRoute: typeof AuthenticatedAdminContentRoute
  AuthenticatedAdminMembershipsRoute: typeof AuthenticatedAdminMembershipsRoute
  AuthenticatedAdminPromotionsRoute: typeof AuthenticatedAdminPromotionsRoute
  AuthenticatedAdminSiteEditorRoute: typeof AuthenticatedAdminSiteEditorRoute
  AuthenticatedAdminSuggestionsRoute: typeof AuthenticatedAdminSuggestionsRoute
  AuthenticatedAdminSupplierRequestsRoute: typeof AuthenticatedAdminSupplierRequestsRoute
  AuthenticatedAdminSystemRoute: typeof AuthenticatedAdminSystemRoute
  AuthenticatedAdminUsersRoute: typeof AuthenticatedAdminUsersRoute
  AuthenticatedAdminVerificationsRoute: typeof AuthenticatedAdminVerificationsRoute
  AuthenticatedAdminIndexRoute: typeof AuthenticatedAdminIndexRoute
}

const AuthenticatedAdminRouteRouteChildren: AuthenticatedAdminRouteRouteChildren =
  {
    AuthenticatedAdminAdsRoute: AuthenticatedAdminAdsRoute,
    AuthenticatedAdminAppointmentsRoute: AuthenticatedAdminAppointmentsRoute,
    AuthenticatedAdminApprovalsRoute: AuthenticatedAdminApprovalsRoute,
    AuthenticatedAdminAuditRoute: AuthenticatedAdminAuditRoute,
    AuthenticatedAdminCatalogRoute: AuthenticatedAdminCatalogRoute,
    AuthenticatedAdminCommentsRoute: AuthenticatedAdminCommentsRoute,
    AuthenticatedAdminContentRoute: AuthenticatedAdminContentRoute,
    AuthenticatedAdminMembershipsRoute: AuthenticatedAdminMembershipsRoute,
    AuthenticatedAdminPromotionsRoute: AuthenticatedAdminPromotionsRoute,
    AuthenticatedAdminSiteEditorRoute: AuthenticatedAdminSiteEditorRoute,
    AuthenticatedAdminSuggestionsRoute: AuthenticatedAdminSuggestionsRoute,
    AuthenticatedAdminSupplierRequestsRoute:
      AuthenticatedAdminSupplierRequestsRoute,
    AuthenticatedAdminSystemRoute: AuthenticatedAdminSystemRoute,
    AuthenticatedAdminUsersRoute: AuthenticatedAdminUsersRoute,
    AuthenticatedAdminVerificationsRoute: AuthenticatedAdminVerificationsRoute,
    AuthenticatedAdminIndexRoute: AuthenticatedAdminIndexRoute,
  }

const AuthenticatedAdminRouteRouteWithChildren =
  AuthenticatedAdminRouteRoute._addFileChildren(
    AuthenticatedAdminRouteRouteChildren,
  )

interface AuthenticatedSuperAdminRouteRouteChildren {
  AuthenticatedSuperAdminBackupsRoute: typeof AuthenticatedSuperAdminBackupsRoute
  AuthenticatedSuperAdminBroadcastRoute: typeof AuthenticatedSuperAdminBroadcastRoute
  AuthenticatedSuperAdminFinanceRoute: typeof AuthenticatedSuperAdminFinanceRoute
  AuthenticatedSuperAdminGrantsRoute: typeof AuthenticatedSuperAdminGrantsRoute
  AuthenticatedSuperAdminIndexRoute: typeof AuthenticatedSuperAdminIndexRoute
}

const AuthenticatedSuperAdminRouteRouteChildren: AuthenticatedSuperAdminRouteRouteChildren =
  {
    AuthenticatedSuperAdminBackupsRoute: AuthenticatedSuperAdminBackupsRoute,
    AuthenticatedSuperAdminBroadcastRoute:
      AuthenticatedSuperAdminBroadcastRoute,
    AuthenticatedSuperAdminFinanceRoute: AuthenticatedSuperAdminFinanceRoute,
    AuthenticatedSuperAdminGrantsRoute: AuthenticatedSuperAdminGrantsRoute,
    AuthenticatedSuperAdminIndexRoute: AuthenticatedSuperAdminIndexRoute,
  }

const AuthenticatedSuperAdminRouteRouteWithChildren =
  AuthenticatedSuperAdminRouteRoute._addFileChildren(
    AuthenticatedSuperAdminRouteRouteChildren,
  )

interface AuthenticatedRouteRouteChildren {
  AuthenticatedAdminRouteRoute: typeof AuthenticatedAdminRouteRouteWithChildren
  AuthenticatedSuperAdminRouteRoute: typeof AuthenticatedSuperAdminRouteRouteWithChildren
  AuthenticatedNotificationsRoute: typeof AuthenticatedNotificationsRoute
  AuthenticatedOrdersRoute: typeof AuthenticatedOrdersRoute
  AuthenticatedProfileRoute: typeof AuthenticatedProfileRoute
  AuthenticatedPushTesterRoute: typeof AuthenticatedPushTesterRoute
  AuthenticatedVerslasRoute: typeof AuthenticatedVerslasRoute
  AuthenticatedDashboardAddonsRoute: typeof AuthenticatedDashboardAddonsRoute
  AuthenticatedDashboardB2bRoute: typeof AuthenticatedDashboardB2bRoute
  AuthenticatedDashboardCustomerRoute: typeof AuthenticatedDashboardCustomerRoute
  AuthenticatedDashboardEmployerJobsRoute: typeof AuthenticatedDashboardEmployerJobsRoute
  AuthenticatedDashboardSalonAppointmentsRoute: typeof AuthenticatedDashboardSalonAppointmentsRoute
  AuthenticatedDashboardSalonCalendarRoute: typeof AuthenticatedDashboardSalonCalendarRoute
  AuthenticatedDashboardSalonClientsRoute: typeof AuthenticatedDashboardSalonClientsRoute
  AuthenticatedDashboardSalonContentRoute: typeof AuthenticatedDashboardSalonContentRoute
  AuthenticatedDashboardSalonEventsRoute: typeof AuthenticatedDashboardSalonEventsRoute
  AuthenticatedDashboardSalonFeaturedRoute: typeof AuthenticatedDashboardSalonFeaturedRoute
  AuthenticatedDashboardSalonInquiriesRoute: typeof AuthenticatedDashboardSalonInquiriesRoute
  AuthenticatedDashboardSalonMembershipRoute: typeof AuthenticatedDashboardSalonMembershipRoute
  AuthenticatedDashboardSalonModelsRoute: typeof AuthenticatedDashboardSalonModelsRoute
  AuthenticatedDashboardSalonOverviewRoute: typeof AuthenticatedDashboardSalonOverviewRoute
  AuthenticatedDashboardSalonProfileRoute: typeof AuthenticatedDashboardSalonProfileRoute
  AuthenticatedDashboardSalonPromoteRoute: typeof AuthenticatedDashboardSalonPromoteRoute
  AuthenticatedDashboardSalonRentalsRoute: typeof AuthenticatedDashboardSalonRentalsRoute
  AuthenticatedDashboardSalonServicesRoute: typeof AuthenticatedDashboardSalonServicesRoute
  AuthenticatedDashboardSalonStaffRoute: typeof AuthenticatedDashboardSalonStaffRoute
  AuthenticatedDashboardSalonVerificationRoute: typeof AuthenticatedDashboardSalonVerificationRoute
  AuthenticatedDashboardSalonWalletRoute: typeof AuthenticatedDashboardSalonWalletRoute
  AuthenticatedDashboardSchoolCoursesRoute: typeof AuthenticatedDashboardSchoolCoursesRoute
  AuthenticatedDashboardSchoolRegistrationsRoute: typeof AuthenticatedDashboardSchoolRegistrationsRoute
  AuthenticatedDashboardSupplierEventsRoute: typeof AuthenticatedDashboardSupplierEventsRoute
  AuthenticatedDashboardSupplierFeedRoute: typeof AuthenticatedDashboardSupplierFeedRoute
  AuthenticatedDashboardSupplierMembershipRoute: typeof AuthenticatedDashboardSupplierMembershipRoute
  AuthenticatedDashboardSupplierProductsRoute: typeof AuthenticatedDashboardSupplierProductsRoute
  AuthenticatedDashboardSupplierProfileRoute: typeof AuthenticatedDashboardSupplierProfileRoute
}

const AuthenticatedRouteRouteChildren: AuthenticatedRouteRouteChildren = {
  AuthenticatedAdminRouteRoute: AuthenticatedAdminRouteRouteWithChildren,
  AuthenticatedSuperAdminRouteRoute:
    AuthenticatedSuperAdminRouteRouteWithChildren,
  AuthenticatedNotificationsRoute: AuthenticatedNotificationsRoute,
  AuthenticatedOrdersRoute: AuthenticatedOrdersRoute,
  AuthenticatedProfileRoute: AuthenticatedProfileRoute,
  AuthenticatedPushTesterRoute: AuthenticatedPushTesterRoute,
  AuthenticatedVerslasRoute: AuthenticatedVerslasRoute,
  AuthenticatedDashboardAddonsRoute: AuthenticatedDashboardAddonsRoute,
  AuthenticatedDashboardB2bRoute: AuthenticatedDashboardB2bRoute,
  AuthenticatedDashboardCustomerRoute: AuthenticatedDashboardCustomerRoute,
  AuthenticatedDashboardEmployerJobsRoute:
    AuthenticatedDashboardEmployerJobsRoute,
  AuthenticatedDashboardSalonAppointmentsRoute:
    AuthenticatedDashboardSalonAppointmentsRoute,
  AuthenticatedDashboardSalonCalendarRoute:
    AuthenticatedDashboardSalonCalendarRoute,
  AuthenticatedDashboardSalonClientsRoute:
    AuthenticatedDashboardSalonClientsRoute,
  AuthenticatedDashboardSalonContentRoute:
    AuthenticatedDashboardSalonContentRoute,
  AuthenticatedDashboardSalonEventsRoute:
    AuthenticatedDashboardSalonEventsRoute,
  AuthenticatedDashboardSalonFeaturedRoute:
    AuthenticatedDashboardSalonFeaturedRoute,
  AuthenticatedDashboardSalonInquiriesRoute:
    AuthenticatedDashboardSalonInquiriesRoute,
  AuthenticatedDashboardSalonMembershipRoute:
    AuthenticatedDashboardSalonMembershipRoute,
  AuthenticatedDashboardSalonModelsRoute:
    AuthenticatedDashboardSalonModelsRoute,
  AuthenticatedDashboardSalonOverviewRoute:
    AuthenticatedDashboardSalonOverviewRoute,
  AuthenticatedDashboardSalonProfileRoute:
    AuthenticatedDashboardSalonProfileRoute,
  AuthenticatedDashboardSalonPromoteRoute:
    AuthenticatedDashboardSalonPromoteRoute,
  AuthenticatedDashboardSalonRentalsRoute:
    AuthenticatedDashboardSalonRentalsRoute,
  AuthenticatedDashboardSalonServicesRoute:
    AuthenticatedDashboardSalonServicesRoute,
  AuthenticatedDashboardSalonStaffRoute: AuthenticatedDashboardSalonStaffRoute,
  AuthenticatedDashboardSalonVerificationRoute:
    AuthenticatedDashboardSalonVerificationRoute,
  AuthenticatedDashboardSalonWalletRoute:
    AuthenticatedDashboardSalonWalletRoute,
  AuthenticatedDashboardSchoolCoursesRoute:
    AuthenticatedDashboardSchoolCoursesRoute,
  AuthenticatedDashboardSchoolRegistrationsRoute:
    AuthenticatedDashboardSchoolRegistrationsRoute,
  AuthenticatedDashboardSupplierEventsRoute:
    AuthenticatedDashboardSupplierEventsRoute,
  AuthenticatedDashboardSupplierFeedRoute:
    AuthenticatedDashboardSupplierFeedRoute,
  AuthenticatedDashboardSupplierMembershipRoute:
    AuthenticatedDashboardSupplierMembershipRoute,
  AuthenticatedDashboardSupplierProductsRoute:
    AuthenticatedDashboardSupplierProductsRoute,
  AuthenticatedDashboardSupplierProfileRoute:
    AuthenticatedDashboardSupplierProfileRoute,
}

const AuthenticatedRouteRouteWithChildren =
  AuthenticatedRouteRoute._addFileChildren(AuthenticatedRouteRouteChildren)

interface DarbasRouteChildren {
  DarbasSlugRoute: typeof DarbasSlugRoute
}

const DarbasRouteChildren: DarbasRouteChildren = {
  DarbasSlugRoute: DarbasSlugRoute,
}

const DarbasRouteWithChildren =
  DarbasRoute._addFileChildren(DarbasRouteChildren)

interface ForumasRouteChildren {
  ForumasSlugRoute: typeof ForumasSlugRoute
  ForumasTemaIdRoute: typeof ForumasTemaIdRoute
}

const ForumasRouteChildren: ForumasRouteChildren = {
  ForumasSlugRoute: ForumasSlugRoute,
  ForumasTemaIdRoute: ForumasTemaIdRoute,
}

const ForumasRouteWithChildren =
  ForumasRoute._addFileChildren(ForumasRouteChildren)

interface MokyklosRouteChildren {
  MokyklosSlugRoute: typeof MokyklosSlugRoute
}

const MokyklosRouteChildren: MokyklosRouteChildren = {
  MokyklosSlugRoute: MokyklosSlugRoute,
}

const MokyklosRouteWithChildren = MokyklosRoute._addFileChildren(
  MokyklosRouteChildren,
)

const rootRouteChildren: RootRouteChildren = {
  IndexRoute: IndexRoute,
  AuthenticatedRouteRoute: AuthenticatedRouteRouteWithChildren,
  AboutRoute: AboutRoute,
  AuthRoute: AuthRoute,
  ContactRoute: ContactRoute,
  DarbasRoute: DarbasRouteWithChildren,
  DukRoute: DukRoute,
  ForBusinessRoute: ForBusinessRoute,
  ForSuppliersRoute: ForSuppliersRoute,
  ForumasRoute: ForumasRouteWithChildren,
  IeskomiModeliaiRoute: IeskomiModeliaiRoute,
  MegstamiRoute: MegstamiRoute,
  MeistraiRoute: MeistraiRoute,
  MokyklosRoute: MokyklosRouteWithChildren,
  PrekiniaiZenklaiRoute: PrekiniaiZenklaiRoute,
  PricingRoute: PricingRoute,
  PrivatumasRoute: PrivatumasRoute,
  SalonaiRoute: SalonaiRoute,
  SearchRoute: SearchRoute,
  SkelbimaiRoute: SkelbimaiRoute,
  TaisyklesRoute: TaisyklesRoute,
  TiekejaiRoute: TiekejaiRoute,
  AppointmentTokenRoute: AppointmentTokenRoute,
  ArticleSlugRoute: ArticleSlugRoute,
  FeedAkcijosRoute: FeedAkcijosRoute,
  FeedPatalposRoute: FeedPatalposRoute,
  FeedRenginiaiRoute: FeedRenginiaiRoute,
  SalonIdRoute: SalonIdRoute,
  ShopSlugRoute: ShopSlugRoute,
  ShopIndexRoute: ShopIndexRoute,
  ApiPublicWebhooksStripeRoute: ApiPublicWebhooksStripeRoute,
}
export const routeTree = rootRouteImport
  ._addFileChildren(rootRouteChildren)
  ._addFileTypes<FileRouteTypes>()

import type { getRouter } from './router.tsx'
import type { startInstance } from './start.ts'
declare module '@tanstack/react-start' {
  interface Register {
    ssr: true
    router: Awaited<ReturnType<typeof getRouter>>
    config: Awaited<ReturnType<typeof startInstance.getOptions>>
  }
}
