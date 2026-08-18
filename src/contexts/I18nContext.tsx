import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';

export type Language = 'en' | 'es';

interface I18nContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  /** `vars` fills `{name}` placeholders in the translated string. */
  t: (key: string, vars?: Record<string, string | number>) => string;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export const useI18n = () => {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error('useI18n must be used within an I18nProvider');
  }
  return context;
};

// Translations object
const translations = {
  en: {
    // Auth
    //
    // What the app says about itself before anyone has signed in. Same voice as the rest of the
    // product: close, no jargon, and no mention of what runs underneath.
    'auth.slogan': 'An agronomist that never rests.',
    'auth.pitch': 'It checks your coffee when you cannot, and tells you when to act.',
    'auth.login.welcome': 'Welcome back',
    'auth.login.lede': 'Sign in to see how your farms are doing.',
    // Its own key for the screen TITLE. `auth.register.title` is the link that offers
    // registration from sign-in, so one shared key puts that link's wording where a heading
    // belongs.
    'auth.register.heading': 'Create your account',
    'auth.register.lede': 'A couple of details and you can start monitoring your coffee.',
    // Placeholders give an EXAMPLE. The label above already names the field, and repeating it
    // inside the box helps nobody.
    'auth.email.placeholder': 'you@example.com',
    'auth.username.placeholder': 'mrodriguez',
    'auth.confirmPassword.placeholder': 'Type it again',
    'auth.forgot': 'Forgot your password?',
    'auth.login.title': 'Log In',
    'auth.register.title': 'Sign Up',
    'auth.username': 'Username',
    'auth.email': 'Email',
    'auth.password': 'Password',
    'auth.confirmPassword': 'Confirm Password',
    'auth.role': 'Role',
    'auth.manager': 'Manager',
    'auth.farmer': 'Farmer',
    // Sentence case. The product's voice is close, and a shouting button is the opposite; the
    // approved prototype writes them this way.
    'auth.login.button': 'Sign in',
    'auth.register.button': 'Create account',
    'auth.switch.login': 'Already have your account?',
    'auth.switch.register': 'Don\'t have an account?',
    'auth.validation.username': 'Please input your username!',
    'auth.validation.email': 'Please input your email!',
    'auth.validation.email.valid': 'Please enter a valid email!',
    'auth.validation.password': 'Please input your password!',
    'auth.validation.password.min': 'Password must be at least 6 characters!',
    'auth.validation.confirmPassword': 'Please confirm your password!',
    'auth.validation.passwords.match': 'Passwords do not match!',
    'auth.validation.role': 'Please select your role!',
    'auth.success.register': 'Registration successful!',
    'auth.error.register': 'Registration failed. Please try again.',
    'auth.error.emailTaken': 'This email is already registered. Please log in or use another email.',
    'auth.error.validation': 'Invalid registration data. Please check your information.',
    'auth.error.server': 'Server error. Please try again later.',
    'auth.error.network': 'Connection error. Please check your internet connection.',
    'auth.success.login': 'Login successful!',
    'auth.error.login': 'Login failed. Please try again.',

    // Dashboard
    'dashboard.empty.title': 'No farms yet',
    'dashboard.empty.description': 'Start your coffee journey by creating your first farm. Click the "Add Farm" button in the sidebar to get started.',

    // Sidebar
    'sidebar.addFarm': 'Add Farm',

    // Farm Management
    'farm.edit': 'Edit',
    'farm.delete': 'Delete',
    'farm.actions': 'Farm actions',
    'farm.location.missingWeather': 'No location · add it to see the weather',
    'farm.meta.sections': '{n} sections',
    'farm.meta.sections.one': '1 section',

    // Weather: OpenWeather's fifteen `main` codes. The API always serves them in English, so
    // they are translated here and the app's switch decides the language.
    'weather.condition.clear': 'Clear',
    'weather.condition.clouds': 'Cloudy',
    'weather.condition.rain': 'Rain',
    'weather.condition.drizzle': 'Drizzle',
    'weather.condition.thunderstorm': 'Thunderstorm',
    'weather.condition.snow': 'Snow',
    'weather.condition.mist': 'Mist',
    'weather.condition.fog': 'Fog',
    'weather.condition.haze': 'Haze',
    'weather.condition.dust': 'Dust',
    'weather.condition.smoke': 'Smoke',
    'weather.condition.sand': 'Sand',
    'weather.condition.ash': 'Ash',
    'weather.condition.squall': 'Squall',
    'weather.condition.tornado': 'Tornado',
    'farm.delete.title': 'Delete farm',
    // Name what gets lost. "All associated data" says nothing: nobody knows what counts as
    // associated until it is gone.
    'farm.delete.lede.before': "You are about to delete",
    'farm.delete.lede.after':
      'and all of its sections. This cannot be undone: its readings and recommendations go with it.',
    'farm.delete.typeName': 'Type the name to confirm',
    'farm.delete.button': 'Delete for good',
    'farm.viewMap': 'View Map',
    'nav.main': 'Main navigation',
    'dashboard.summary': 'today at a glance',
    'greeting.morning': 'Good morning, {name}',
    'greeting.afternoon': 'Good afternoon, {name}',
    'greeting.evening': 'Good evening, {name}',
    'banner.crop': '{n} farms need care',
    // KEEP THESE FOUR. `StatusBanner` builds the singular forms with `t(`${key}.one`)`, from a
    // VARIABLE, so the literal appears nowhere and a sweep for unused keys does not see them.
    // Delete them and the panel renders "banner.device.one" verbatim on screen.
    'banner.crop.one': '1 farm needs care',
    'banner.device.one': '1 farm has equipment to check',
    'banner.setup.one': '1 farm is waiting to be set up',
    'banner.ok.one': 'Your farm is fine',
    'banner.device': '{n} farms have equipment to check',
    'banner.setup': '{n} farms are waiting to be set up',
    'banner.ok': 'All {n} farms are fine',
    'banner.detail.ok': '{n} all good',
    'banner.detail.device': '{n} to check',
    'banner.detail.setup': '{n} to set up',
    'farmsMap.title': 'Where your farms are',
    'farmsMap.missing': '{n} not on the map yet',
    'farmsMap.hint': 'The pin colour matches the farm card. Tap a pin to open the farm.',
    'farmsMap.empty': 'None of your farms is located yet. Set one and it will show up here.',
    'dashboard.error.title': "We couldn't load your farms",
    'dashboard.error.body': 'Check your connection. Your data is safe — we just could not fetch it right now.',
    'dashboard.error.retry': 'Try again',
    'farm.state.cropAlert': '{n} need care',
    'farm.state.silent': '{n} not reporting',
    'farm.state.noHub': '{n} without a sensor',
    'farm.state.noSections': 'No sections yet',
    // The farm measures, just not in every plot: said without moving it out of the calm group.
    'farm.state.partial': '{r} of {n} measuring',
    'dashboard.state.unavailable':
      'The state of your farms could not be calculated. The list is here; the diagnosis is not.',
    'farmsMap.openSections': 'View sections',
    'farm.filter.label': 'Filter by group',
    'farm.filter.all': 'All',
    'farm.search.label': 'Search a farm by name',
    'farm.search.placeholder': 'Farm name…',
    'farm.search.close': 'Close search',
    'farm.search.noMatch': 'No farm matches “{q}”.',
    'farm.tier.crop': 'Need care',
    'farm.tier.device': 'Check the equipment',
    'farm.tier.setup': 'To set up',
    'farm.tier.ok': 'All good',
    'farm.tier.crop.hint': 'The coffee is asking for something today.',
    'farm.tier.device.hint': 'They were measuring and went quiet. Worth a look.',
    'farm.tier.setup.hint': "Nothing is broken — these are still waiting to be set up.",
    'farm.tier.ok.hint': 'Measuring and within range.',
    'map.layer': 'Map layer',
    'farm.map.unlocated.title': "This farm isn't located yet",
    'farm.map.unlocated.body': 'Edit the farm and mark its position to see it on the map.',
    'farm.map.approximate.title': 'Approximate location',
    'farm.map.approximate.body': 'The pin marks the district, not the plot. Edit the farm and drag the pin onto your coffee to make it precise.',
    'map.layer.street': 'Map',
    'map.layer.satellite': 'Satellite',
    'farm.location.noResults': 'No places found. Try the district or nearest village.',
    'notFound.farm.title': 'That farm is no longer here',
    'notFound.section.title': 'That section is no longer here',
    'notFound.hub.title': 'That hub is no longer here',
    'notFound.body': 'It may have been deleted, or the link points somewhere that no longer exists.',
    'nav.farms': 'Farms',
    'nav.hubs': 'Hubs',
    'nav.logout': 'Sign out',
    'nav.goHome': 'Go to farms',
    'nav.profile': 'Profile',
    'role.manager': 'Manager',
    'role.farmer': 'Farmer',
    // Profile
    'profile.title': 'My profile',
    'profile.lede': 'Your account and how urgent alerts reach you.',
    'profile.account': 'Account',
    'profile.sms.title': 'SMS alerts',
    'profile.sms.hint': 'When a critical alert needs action today and your farm has no internet, we can text it to your phone.',
    'profile.phone.label': 'Phone number',
    'profile.phone.invalid': 'Enter the number in international format, e.g. +51987654321.',
    'profile.optin.label': 'Receive SMS alerts',
    'profile.verified': 'Verified',
    'profile.unverified': 'Not verified',
    'profile.alertsActive': "You'll receive SMS alerts.",
    'profile.save': 'Save',
    'profile.saved': 'Saved.',
    'profile.saveError': 'Could not save. Please try again.',
    'profile.verify.title': 'Verify your number',
    'profile.verify.hint': "We'll text a code to {phone} to confirm it's yours.",
    'profile.verify.send': 'Send code',
    'profile.verify.sent': 'Code sent.',
    'profile.verify.sendError': 'Could not send the code. Please try again.',
    'profile.verify.confirm': 'Verify',
    'profile.verify.ok': 'Number verified.',
    'profile.verify.error': "That code didn't work. Request a new one.",
    'profile.verify.locked': 'Too many attempts. Request a new code.',
    'access.managerOnly.title': 'Only the administrator',
    'access.managerOnly.body': 'This section is managed by whoever administers the farm. If you need something from here, let them know.',
    'access.managerOnly.action': 'Back to my farms',
    // Age is worded by `sensors.time.*` through `relativeLabel`; only the caption lives here.
    // One source for the wording, or this view and the section list end up describing the same
    // gap in different words.
    'farm.lastReading.label': 'Last reading:',
    'farm.location.or': 'or',
    'farm.location.useCurrent': "I'm at the farm now",
    'farm.location.locating': 'Getting your position…',
    'farm.location.noGeolocation': 'This device cannot share its position. Use the search instead.',
    'farm.location.locateFailed': 'Could not get your position. Use the search instead.',
    'farm.location.approximateNote': 'This is the district, not the farm itself. Good enough for weather; drag the pin for the map.',
    'farm.location.exactNote': 'Exact point saved · {lat}, {lng}',
    'farm.location.dragHint': 'Drag the pin onto your coffee plot, or tap the map.',
    'farm.location.emptyHint': 'Search or use your position to place the farm on the map.',
    'boundary.draw': 'Draw the boundary',
    'boundary.editWithArea': 'Boundary drawn · {area}',
    'boundary.title': 'Draw your farm boundary',
    'boundary.hint': 'Tap the map to add corners. Close it by tapping the first one, or press Finish.',
    'boundary.area': 'Area',
    'boundary.area.pending': 'Add at least 3 corners',
    'boundary.undo': 'Undo',
    'boundary.reset': 'Start over',
    'boundary.finish': 'Finish',
    'boundary.cancel': 'Cancel',
    'boundary.save': 'Save boundary',
    'farm.location.unset': 'Location not set',
    'farm.location.fix': 'Set location',
    'farm.success.delete': 'Farm deleted successfully!',
    'farm.error.delete': 'Failed to delete farm. Please try again.',
    'farm.success.update': 'Farm updated successfully!',
    'farm.error.update': 'Failed to update farm. Please try again.',
    'farm.success.create': 'Farm created successfully!',
    'farm.error.create': 'Failed to create farm. Please try again.',
    'farm.add.title': 'Add New Farm',
    'farm.add.button': 'Add Farm',
    'farm.edit.title': 'Edit Farm',
    'farm.edit.button': 'Update Farm',
    'farm.name': 'Farm Name',
    'farm.name.placeholder': 'Enter farm name',
    'farm.name.validation': 'Please enter a farm name',
    'farm.name.length.min': 'Farm name must be at least 2 characters',
    'farm.name.length.max': 'Farm name cannot exceed 50 characters',
    'farm.location': 'Location',
    'farm.location.placeholder': 'Search for the village or district…',
    'farm.location.validation': 'Please enter a location',
    'farm.altitude': 'Altitude (meters)',
    'farm.altitude.placeholder': 'Enter altitude in meters',
    'farm.altitude.range': 'Enter an altitude between {min} and {max} m',
    'farm.altitude.optional': 'Optional. If you leave it blank we will not adjust the diagnosis by altitude.',
    'farm.altitude.deriving': 'Looking up the altitude for this point…',
    'farm.altitude.derived': 'Filled in from the map: {metres} m. You can correct it if you know it exactly.',
    'farm.altitude.mismatch': 'The map gives {metres} m for this point, {diff} m away from what you entered. It may be that the pin and the altitude are not describing the same spot.',
    'farm.altitude.noCoords': 'Place the farm on the map and we will suggest the altitude.',

    // Farm Sections
    'sections.hub.labelOptional': 'Hub for this section (optional)',
    'sections.hub.optionalHint': 'You can also link it later from the section card.',
    'sections.hub.noneAvailableShort': 'No hubs available',
    'sections.hub.assignAfterCreateFailed': 'The section was created, but the hub could not be linked. You can assign it from the card.',
    'sections.hub.label': 'Hub measuring this section',
    'sections.hub.remove': 'Remove',
    'sections.hub.removed': 'Hub removed from this section',
    'sections.hub.assign': 'Assign',
    'sections.hub.assigned': 'Hub assigned',
    'sections.hub.assignError': 'The hub could not be assigned',
    'sections.hub.selectPlaceholder': 'Choose a hub',
    'sections.hub.noneAvailable': 'No unassigned hubs. A hub registers itself on its first reading.',
    'sections.hub.installedSince': 'Installed since {date}',
    'sections.coverage.reporting': 'Receiving data',
    'sections.coverage.stale': 'No data recently',
    'sections.coverage.noHub': 'No hub',
    'nav.backTo': 'Back to {destination}',
    'sections.title': 'Farm Sections',
    'sections.empty.title': 'No sections yet',
    'sections.empty.description': 'Add sections to organize your farm better.',
    'sections.add': 'Add Section',
    'sections.actions': 'Section actions',
    'sections.summary.reporting': '{n} reporting',
    'sections.summary.stale': '{n} without recent data',
    'sections.summary.noHub': '{n} without a sensor',
    'sections.card.allGood': 'All in order',
    'sections.edit': 'Edit Section',
    'sections.edit.button': 'Update Section',
    'sections.delete': 'Delete Section',
    'sections.delete.title': 'Delete section',
    'sections.delete.lede.before': 'You are about to delete',
    'sections.delete.lede.after':
      'This cannot be undone: its readings and the recommendations built on them go with it.',
    'sections.delete.typeName': 'Type the name to confirm',
    'sections.delete.button': 'Delete for good',
    'sections.name': 'Section Name',
    'sections.name.placeholder': 'Enter section name',
    'sections.name.validation': 'Please enter a section name',
    'sections.name.length.min': 'Section name must be at least 2 characters',
    'sections.name.length.max': 'Section name cannot exceed 50 characters',
    'sections.growthStage': 'Growth Stage Type',
    'sections.growthStage.placeholder': 'Select growth stage',
    'sections.growthStage.validation': 'Please select a growth stage',
    'sections.success.create': 'Section created successfully!',
    'sections.success.update': 'Section updated successfully!',
    'sections.success.delete': 'Section deleted successfully!',
    'sections.error.create': 'Failed to create section.',
    'sections.error.update': 'Failed to update section.',
    'sections.error.delete': 'Failed to delete section.',

    // Section Types
    'sectionType.plantula': 'Seedling',
    'sectionType.vegetativo': 'Vegetative',
    'sectionType.floracion': 'Flowering',
    'sectionType.fructificacion': 'Fruiting',
    'sectionType.cosecha': 'Harvest',
    'sectionType.maduracion': 'Ripening',

    // Section Detail

    // Section Data

    // Section detail — verdict ("answer first")
    'section.verdict.eyebrow.one': '1 thing to deal with today',
    'section.verdict.eyebrow.many': '{count} things to deal with today',
    'section.verdict.showSteps': 'Show me how',
    'section.verdict.hideSteps': 'Hide the steps',
    'section.verdict.stepByStep': 'Step by step',
    // The connectors add NO judgement: the engine's dose already carries its basis
    // ("40 g/plant", "~2 kg/ha"). Writing "per plant" here would turn a per-hectare dose into
    // something else.
    'section.verdict.step.get': 'Get {product}.',
    'section.verdict.step.apply': 'Apply {dose}.',
    'section.verdict.step.applyWithMethod': 'Apply {dose} ({method}).',
    'section.verdict.step.timing': 'Do it {timing}.',
    'section.verdict.techHint': 'Technical? Switch to Agronomist above for exact doses and reasoning.',
    'section.verdict.allGood.headline': 'Your coffee is doing well today',
    'section.verdict.allGood.seen': 'Last checked {when} · nothing to deal with',
    'section.verdict.stage': 'Stage: {stage}',
    'section.verdict.next': 'Coming up',

    // Section detail — density toggle (Manager only)
    'section.density.label': 'View as',
    'section.density.agronomist': 'Agronomist',
    'section.density.farmer': 'Farmer',

    // Section detail — live sensor panel
    'section.sensor.title': 'Sensor readings',
    'section.sensor.cadence': 'We check your coffee every 2 minutes',
    'section.sensor.seen': 'seen {when}',
    'section.sensor.nextIn': 'Next in {time}',
    'section.sensor.noAlert': 'No alert',
    'section.sensor.unreliable': 'No reliable reading',
    'section.sensor.unreliableNote':
      'The sensor is outside the range it can be trusted in, so there is no telling whether it is fine or not — neither green nor red.',
    'section.sensor.noReference': 'Reference bands unavailable: values are shown without a verdict.',

    // Section detail — states without a diagnosis
    'section.state.noHub.title': 'This plot is not measured yet',
    'section.state.noHub.body':
      'No device is measuring here yet, so we cannot tell you how it is doing. It is not an error: it just needs installing.',
    'section.state.noHub.assign': 'Assign a hub',
    'section.state.noHub.askManager': 'Ask whoever manages the farm to install one.',
    'section.state.silent.eyebrow': 'The sensor is not reporting',
    'section.state.silent.title': 'No readings since {since}',
    'section.state.silent.body':
      'We would rather not advise you from stale data. It could be the battery, the signal, or the device shutting down.',
    'section.state.silent.lastKnown': 'Last time we heard from your coffee: {when}{vitals}',
    'section.state.neverReported.title': 'The hub has not reported yet',
    'section.state.neverReported.body':
      'The device is assigned to this section but has not sent a single reading, so there is nothing to diagnose yet.',

    // Section detail — recommendation cards
    'section.rec.action': 'Action',
    'section.rec.product': 'Product',
    'section.rec.dose': 'Dose',
    'section.rec.method': 'Method',
    'section.rec.methodValue': '{method}',
    'section.rec.timing': 'Timing',
    'section.rec.saving': 'Saves resources',
    'section.rec.forecast': 'Forecast ~{hours} h',
    'section.rec.provisional': 'Provisional reading',
    'section.rec.tag.referential': 'For reference',
    'section.rec.tag.coordinate': 'Coordinate first',
    'section.rec.tag.confirm': 'Confirm first',
    'section.rec.tech.show': 'Show technical detail',
    'section.rec.tech.hide': 'Hide technical detail',
    'section.rec.tech.label': 'Technical',
    'section.rec.verify': 'Verify',
    'section.rec.referral': 'Referral',
    'section.rec.note': 'Note',
    'section.rec.reminders': 'Reminders ({count})',
    'section.rec.allGood': '{subjects}: all in order.',
    'section.rec.filterEmpty': 'No cards of this kind in this view.',
    'section.rec.clearFilter': 'Clear filter',
    'section.rec.filterBy': 'Filter by {noun}',
    'section.rec.sev.critical': 'critical',
    'section.rec.sev.critical.plural': 'critical',
    'section.rec.sev.alert': 'alert',
    'section.rec.sev.alert.plural': 'alerts',
    'section.rec.sev.warning': 'warning',
    'section.rec.sev.warning.plural': 'warnings',
    'section.rec.sev.info': 'info',
    'section.rec.sev.info.plural': 'info',
    // Fallback for an older record that carries no `actionability_label` from the engine.
    'section.rec.actionability.direct': 'You can do it now',
    'section.rec.actionability.verify': 'Check first',
    'section.rec.actionability.consult': 'Ask the technician',
    'section.rec.actionability.structural': 'Long-term measure',
    'section.rec.actionability.monitor': 'Watch and wait',
    'section.rec.actionability.none': 'All in order',

    // Recommendations
    'recommendations.title': 'Recommendations',
    'recommendations.noAvailable': 'No recommendations available',

    // Card Data (Sensor Data)
    'cardData.noData': 'No data available',
    'cardData.temperature': 'Temperature',
    'cardData.airHumidity': 'Air Humidity',
    'cardData.soilHumidity': 'Soil Humidity',
    'cardData.precipitation': 'Precipitation',
    'cardData.nitrogen': 'Nitrogen',
    'cardData.phosphorus': 'Phosphorus',
    'cardData.potassium': 'Potassium',

    // Sensors & Devices
    //
    // Hubs — the inventory. Each row is a HUB (one ESP32 per section, averaging what its Nodes
    // send), not a single sensor: the instruments (NPK CWT-SOIL-NPK-S, DHT22, capacitive soil
    // moisture v1.2, FC-37) live in the Nodes and are not inventoried.
    'hubs.eyebrow': 'Inventory · manager only',
    'hubs.title': 'Hubs',
    'hubs.lede':
      'One hub per section; assignments are temporary and keep their history. Device state is a technical fact, not a judgement about the crop.',
    'hubs.readOnly':
      'Equipment shows up here only once it starts sending data. You do not register it: you just put it in a plot or take it out.',
    // State DERIVED from the last reading, not the stored `status`. See `utils/hubState`.
    'hubs.state.reporting': 'Reporting',
    'hubs.state.silent': 'No signal',
    'hubs.state.unassigned': 'Unassigned',
    'hubs.state.never': 'Never reported',
    'hubs.stats.total': 'Hubs in inventory',
    'hubs.stats.reporting': 'Reporting',
    'hubs.stats.reporting.hint': 'sent data recently',
    'hubs.stats.silent': 'No signal',
    'hubs.stats.silent.hint': 'quiet for over half a day',
    'hubs.stats.unassigned': 'Unassigned',
    'hubs.stats.unassigned.hint': 'no plot yet',
    // Short form for the phone pills, where the figure comes first: "1 reporting".
    'hubs.stats.reporting.short': 'reporting',
    'hubs.stats.silent.short': 'no signal',
    'hubs.stats.unassigned.short': 'unassigned',
    'hubs.allHubs': 'All hubs',
    'hubs.row.noSection': 'No plot',
    'hubs.empty.title': 'No hubs to show',
    'hubs.empty.none': 'Hubs appear here on their first reading.',
    'hubs.empty.filtered': 'None of your hubs is in that state right now.',
    'hubs.empty.clear': 'Show all hubs',
    // Hub detail
    'hubs.detail.title': 'Hub detail',
    'hubs.detail.lastReading': 'Last reading',
    'hubs.detail.cadence': 'How often it reports',
    'hubs.detail.cadenceValue': 'every {minutes} min',
    'hubs.detail.assignment': 'Current assignment',
    'hubs.detail.since': 'Installed on {date}',
    'hubs.detail.assign': 'Assign',
    'hubs.detail.assignTo': 'Assign to a section',
    'hubs.detail.reassign': 'Reassign',
    'hubs.detail.reassignTo': 'Move to another section',
    'hubs.detail.remove': 'Remove from the section',
    'hubs.detail.assigned': 'Hub assigned',
    'hubs.detail.reassigned': 'Hub moved',
    'hubs.detail.removed': 'Hub removed from the section',
    'hubs.detail.failed': 'That could not be done',
    'hubs.detail.noFreeSections': 'Every section already has a hub.',
    'hubs.detail.unassignedWhy':
      'It is sending data, but the data is not tied to any plot, so nobody sees it. Put it in a plot to make it count.',
    'hubs.detail.history': 'Assignment history',
    'hubs.detail.historyEmpty': 'This hub has not been in any section yet.',
    'hubs.detail.historyWhy':
      'We keep track of where the equipment has been, so earlier readings still count for the plot where they were taken.',
    'hubs.detail.installed': 'installed',
    'hubs.detail.now': 'now',
    'hubs.detail.sectionGone': 'Deleted section',
    'hubs.detail.confirmMove': 'Move',
    // History labels describe the PERIOD, not the device. "Installed" is what the assignment
    // above says; here what matters is whether the stretch is still open.
    'hubs.detail.periodOpen': 'open',
    'hubs.detail.periodClosed': 'closed',
    'sensors.card.copied.announce': 'Hub MAC copied to clipboard',
    'sensors.card.copyCode': 'Copy the hub MAC',
    'sensors.time.minutes': '{count} min ago',
    'sensors.time.hours': '{count} h ago',
    // The singular gets its own key: "1 days ago" would sit right above the diagnosis.
    'sensors.time.day': '1 day ago',
    'sensors.time.days': '{count} days ago',
    'sensors.time.never': 'Never reported',
    // MIND THE NAME: `sensors.*` is the endpoint (/sensors), not what the row represents. Each
    // inventory row is a HUB (one ESP32 per section, averaging what its Nodes send), not a single
    // sensor. The instruments (NPK CWT-SOIL-NPK-S, DHT22, capacitive soil moisture v1.2, FC-37)
    // live in the Nodes and are not inventoried.
    'sensors.error.loading': 'Error loading hub inventory',
    'sensors.tryAgain': 'Try Again',

    // Reports
    'reports.title': 'Historical analysis',
    'reports.eyebrow': 'Reports · manager only',
    'reports.pickFarm': 'Pick a farm to see its history.',

    // Atajos de rango
    'reports.range.7d': '7 days',
    'reports.range.30d': '30 days',
    'reports.range.90d': '90 days',
    'reports.range.custom': 'Custom',

    // Aviso de rango real
    'reports.rangeNotice':
      'You asked for {requested}, but there is only data between {actual}. The chart shows the period with real readings, not the one requested.',

    // Stats strip
    'reports.stats.readings': 'Readings',
    'reports.stats.readings.hint': 'in the period',
    // "Model" and "band" are our words, not the user's: they name the rules engine and its
    // optimal range. The manager does not have a model, he has a coffee plot - and everything
    // else on this screen names something he observes.
    'reports.stats.inBand': 'Time in range',
    'reports.stats.inBand.hint': 'inside the reference range',
    'reports.stats.inBand.noModel': 'The reference could not be fetched',
    'reports.stats.rainDays': 'Rainy days',
    'reports.stats.rainDays.hint': 'recorded in the field',
    'reports.stats.alerts': 'Alerts raised',
    'reports.stats.alerts.hint': 'diagnoses asking for action',
    'reports.stats.alerts.unavailable': 'Could not be consulted',
    'reports.stats.uptime': 'Days with data',
    'reports.stats.uptime.hint': '{days} of {total} days',

    // The header line of every metric
    // The four slots every metric fills, in the same order and with the same opening words.
    // Without them the numbers floated unlabelled: "58.5 %" gave no clue that it was the last
    // reading of the window rather than a share of the period.
    'reports.chart.lastReading': 'Last reading',
    // Short, because it is now a tag aligned against "Model". That it refers to the period is
    // carried by the contrast with the line above, which says "last reading".
    'reports.chart.measuredIn': 'Measured',
    'reports.chart.model': 'Reference',
    'reports.chart.acceptedRange': 'Accepted range',
    'reports.chart.coverInRange': 'Inside the range {pct}% of the period',
    'reports.chart.coverNoCross': 'No threshold crossed {pct}% of the period',
    // English keeps the percent tight to the number; Spanish spaces it, as the engine's own
    // threshold values do.
    'reports.chart.thresholdFrom': 'From',
    'reports.chart.thresholdBelow': 'Below',
    'reports.chart.noFixedRange': 'No fixed range',
    'reports.chart.observed': 'Measured',
    // Written out: there is room on the line, and "avg / min / max" made the reader decode
    // three words to save eleven characters.
    'reports.chart.avg': 'Average',
    'reports.chart.min': 'minimum',
    'reports.chart.max': 'maximum',

    // Leyenda
    'reports.legend.measured': 'Measured value',
    'reports.legend.band': 'Accepted range',
    'reports.legend.threshold': 'Risk threshold (dashed)',
    'reports.legend.rain': 'Rain detected',
    'reports.legend.hint': 'Hover the chart to read date and value.',

    // Rain, and the sampling artefact it carries
    // "Detected", not "it rained": the FC-37 answers yes or no at the sampling instant, so a
    // shower between two readings leaves no trace and the wording should not promise otherwise.
    'reports.rain.summary': 'Rain detected on {rained} of {total} days',
    'reports.rain.between': 'rain between {from} and {to}',
    'reports.rain.spells': 'rain in {n} spells, from {from} to {to}',
    'reports.rain.readings': '{rainy} of the {total} readings that day',
    'reports.rain.none': 'no rain detected',
    'reports.note.tag': 'Good to know',
    'reports.note.title': 'Rain inflates nutrient readings',
    'reports.note.body':
      'When it rains, N, P and K read higher because of soil moisture, not because there is more nutrient. Before reading a spike as an improvement, compare it with the rainy days above.',

    // Regional rainfall in millimetres. The label carries provenance AND uncertainty: without
    // it, a figure from a 9 km cell reads as if it came from the plot.
    'reports.regionalRain.title': 'Rainfall in the area (regional model)',
    'reports.regionalRain.total': '{mm} mm over the period · tallest bar {max} mm',
    'reports.regionalRain.caveat':
      'These millimetres do not come from your hub — its sensor only reports whether it rained, not how much. They come from a 9 km weather model that covers the area, so they describe the zone and not your plot. Bar heights are relative to the tallest day shown, so two periods cannot be compared by eye. Treat them as context, not as a measurement: for the same point, different models disagree by up to threefold, and none of them has been checked against a rain gauge here.',
    'reports.regionalRain.loading': 'Loading rainfall for the area…',
    'reports.regionalRain.unavailable': 'Rainfall for the area is unavailable right now. The report above is unaffected: it is all measured data.',
    'reports.regionalRain.noCoords': 'Place this farm on the map and we will also show the rainfall the area recorded, in millimetres. Your hub only reports whether it rained, not how much.',

    // Export
    'reports.export.title': 'Export this report',
    'reports.export.soon': 'soon',
    'reports.export.success': 'Report exported to CSV successfully',
    'reports.dateRange': 'Date Range',
    'reports.farmFilter': 'Filter by Farm',
    'reports.sectionFilter': 'Filter by Section',
    'reports.dataType': 'Data Type',
    'reports.dataTypes.all': 'All Data',
    'reports.dataTypes.environmental': 'Environmental',
    'reports.dataTypes.soil': 'Soil Data',
    'reports.dataTypes.nutrients': 'Nutrients',
    'reports.placeholders.selectFarm': 'Select a farm',
    'reports.placeholders.allSections': 'All sections',
    'reports.error.loadingFarms': 'Error loading farms',
    'reports.error.loadingSections': 'Error loading sections',
    'reports.error.generating': 'Error generating report',
    'reports.error.failed': 'Failed to generate report',
    'reports.chart.title': 'Data Visualization',
    'reports.chart.noData': 'No data available for visualization',
    'reports.chart.temperature': 'Temperature (°C)',
    'reports.chart.airHumidity': 'Air humidity (%)',
    'reports.chart.soilHumidity': 'Soil humidity (%)',
    'reports.chart.nitrogen': 'Nitrogen (mg/kg)',
    'reports.chart.phosphorus': 'Phosphorus (mg/kg)',
    'reports.chart.potassium': 'Potassium (mg/kg)',
    'reports.chart.precipitation': 'Rain',
    'reports.chart.filter.all': 'All',
    'reports.chart.rain.hint': 'Shades the periods when it rained. Relevant for soil moisture, air humidity and nitrogen.',
    'reports.chart.showingAll': 'Showing all {total} readings',
    // Zooming into a quiet stretch can leave a single reading, and "all 1 readings" reads like
    // a bug even though the number is right.
    'reports.chart.showingOne': 'Showing the only reading in this stretch',
    'reports.chart.showingSome': 'Showing {drawn} of {total} readings, keeping the peaks',
    'reports.chart.zoom.reset': 'See the whole period',
    'reports.chart.emptyPeriod': '{pct}% of the period has no readings',
    'reports.chart.nav.hint': 'Drag the window to zoom in; pull its edges to widen it',
    'reports.chart.nav.label': 'Period on screen',
    'reports.table.title': 'Raw Data Table',
    'reports.table.timestamp': 'Timestamp',
    'reports.table.farm': 'Farm',
    'reports.table.section': 'Section',
    'reports.table.temperature': 'Temperature',
    'reports.table.tempShort': 'Temp',
    'reports.table.airHumidity': 'Air Humidity',
    'reports.table.airHumidityShort': 'Air H.',
    'reports.table.soilHumidity': 'Soil Humidity',
    'reports.table.soilHumidityShort': 'Soil H.',
    'reports.table.precipitation': 'Precipitation',
    'reports.table.precipitationShort': 'Rain',
    'reports.table.searchPlaceholder': 'Search farms, sections, or dates',
    'reports.table.searchShort': 'Search...',
    'reports.table.total': 'Total',
    'reports.table.perPage': '/ page',
    'reports.table.reveal': 'See the {n} readings',
    'reports.table.hide': 'Hide the table',
    'reports.noData': 'No data available for the selected period',

    // Weather

    // Modals

    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.reports': 'Reports',

    // Common
    'common.loading': 'Loading...',
    'common.save': 'Save',
    'common.cancel': 'Cancel',
    'common.yes': 'Yes',
    'common.no': 'No',
    'common.refresh': 'Refresh',
    'common.back': 'Back',
    'common.changeLanguage': 'Change language',
    /** For what is planned but not working yet. Shown disabled rather than hidden. */
    'common.soon': 'soon',

    // ── Crop log ─────────────────────────────────────────────────────────────────────────
    'log.title': 'Crop log',
    'log.lede':
      'Write down when things happen in the plot. With those dates the alerts arrive at the right moment instead of by estimate.',
    'log.record': 'Record',
    'log.when': 'When did it happen?',
    'log.note': 'Note (optional)',
    'log.addNote': 'Add a note',
    'log.saving': 'Saving…',
    'log.loading': 'Loading…',
    'log.pending': 'Not recorded yet',
    'log.seeAll': 'See the full history ({count})',
    'log.onboard.body':
      'Nothing recorded yet. With two entries a year — flowering and the end of harvest — the system stops estimating by stage and warns you on the right date.',
    'log.onboard.flowering': '→ when the bean can be bored',
    'log.onboard.harvest': '→ when the second pass is due',
    'log.onboard.action': 'Record the first one',

    // Event types. Colour axis 3: categorical, none of them is "bad".
    'log.type.flowering.label': 'Flowering',
    'log.type.flowering.hint': 'Starts the count for when the bean can be attacked by the borer.',
    'log.type.flowering.question': 'When did it flower?',
    'log.type.flowering.placeholder': 'e.g. even flowering across the plot',
    'log.type.fertilization.label': 'Fertilising',
    'log.type.fertilization.hint':
      'Used to warn you about the soil test and the risk of rain washing the fertiliser away.',
    'log.type.fertilization.question': 'When did you fertilise?',
    'log.type.fertilization.placeholder': 'e.g. bocashi on the upper plot',
    'log.type.harvest_end.label': 'End of harvest',
    'log.type.harvest_end.hint':
      'In 2–3 weeks we remind you of the second pass (picking up the beans left behind).',
    'log.type.harvest_end.question': 'When did the harvest end?',
    'log.type.harvest_end.placeholder': 'e.g. last pass, beans left along the edges',
    'log.type.soil_sampling.label': 'Soil sampling',
    'log.type.soil_sampling.hint': 'Resets the test reminder (every 2 years is the recommendation).',
    'log.type.soil_sampling.question': 'When did you take the sample?',
    'log.type.soil_sampling.placeholder': 'e.g. sample sent to the lab',
    'log.type.liming.label': 'Liming',
    'log.type.liming.hint': 'Resets the liming reminder.',
    'log.type.liming.question': 'When did you lime?',
    'log.type.liming.placeholder': 'e.g. dolomitic lime in bands',

    // Consequences. `statusFor` decides the tone; only the text lives here.
    'log.status.flowering.stale': 'Old record · note the new flowering',
    'log.status.flowering.countdown': 'Bean borer-prone in ~{days} days',
    'log.status.flowering.since': 'Bean borer-prone from {date}',
    'log.status.harvest.window': 'Second pass from {from} to {to}',
    'log.status.harvest.now': 'Second pass is due now',
    'log.status.harvest.past': 'Second-pass window closed',
    'log.status.sampling.due': 'Time to renew the soil test',
    'log.status.sampling.ok': 'Up to date · next in {year}',
    'log.status.liming.due': 'Worth reviewing the liming',
    'log.status.liming.ok': 'Up to date · next in {year}',
    'log.status.fertilization.from': 'Soil sampling from {date}',
    'log.status.fertilization.good': 'Good window for soil sampling',

    'log.history.title': 'Log history',
    'log.history.count': '{count} records',
    'log.history.count.one': '1 record',
    'log.history.cycle': 'Season cycle',
    'log.history.always': 'RE-RE sanitation · always on',
    'log.history.all': 'All records',
    'log.history.ago': '{days} d ago',
    'log.history.delete.ask': 'Delete?',
    'log.history.delete.yes': 'Yes, delete',
    'log.history.delete.hint': 'Delete (if it was recorded by mistake)',
    'log.history.delete.label': 'Delete {type} from {date}',
    'common.close': 'Close',
    'common.error': 'Error',
  },
  es: {
    // Auth
    //
    // What the app says about itself before anyone has signed in. Same voice as the rest of the
    // product: close, no jargon, and no mention of what runs underneath.
    'auth.slogan': 'Un agrónomo que no descansa.',
    'auth.pitch': 'Revisa tu café cuando tú no puedes y te dice cuándo actuar.',
    'auth.login.welcome': 'Bienvenido de nuevo',
    'auth.login.lede': 'Ingresa para ver el estado de tus fincas.',
    // Its own key for the screen TITLE. `auth.register.title` is the link that offers
    // registration from sign-in, so one shared key puts that link's wording where a heading
    // belongs.
    'auth.register.heading': 'Crea tu cuenta',
    'auth.register.lede': 'Un par de datos y empiezas a vigilar tu café.',
    // Placeholders give an EXAMPLE. The label above already names the field, and repeating it
    // inside the box helps nobody.
    'auth.email.placeholder': 'tucorreo@ejemplo.com',
    'auth.username.placeholder': 'mrodriguez',
    'auth.confirmPassword.placeholder': 'Escríbela otra vez',
    'auth.forgot': '¿Olvidaste tu contraseña?',
    'auth.login.title': 'Iniciar Sesión',
    'auth.register.title': 'Registrarse',
    'auth.username': 'Nombre de usuario',
    'auth.email': 'Correo electrónico',
    'auth.password': 'Contraseña',
    'auth.confirmPassword': 'Confirmar contraseña',
    'auth.role': 'Rol',
    'auth.manager': 'Gerente',
    'auth.farmer': 'Agricultor',
    // Sentence case. The product's voice is close, and a shouting button is the opposite; the
    // approved prototype writes them this way.
    'auth.login.button': 'Iniciar sesión',
    'auth.register.button': 'Crear cuenta',
    'auth.switch.login': '¿Ya tienes una cuenta?',
    'auth.switch.register': '¿No tienes una cuenta?',
    'auth.validation.username': '¡Por favor ingresa tu nombre de usuario!',
    'auth.validation.email': '¡Por favor ingresa tu correo electrónico!',
    'auth.validation.email.valid': '¡Por favor ingresa un correo válido!',
    'auth.validation.password': '¡Por favor ingresa tu contraseña!',
    'auth.validation.password.min': '¡La contraseña debe tener al menos 6 caracteres!',
    'auth.validation.confirmPassword': '¡Por favor confirma tu contraseña!',
    'auth.validation.passwords.match': '¡Las contraseñas no coinciden!',
    'auth.validation.role': '¡Por favor selecciona tu rol!',
    'auth.success.register': '¡Registro exitoso!',
    'auth.error.register': 'Error en el registro. Inténtalo de nuevo.',
    'auth.error.emailTaken': 'Este correo electrónico ya está registrado. Por favor, inicia sesión o usa otro correo.',
    'auth.error.validation': 'Datos de registro inválidos. Por favor verifica tu información.',
    'auth.error.server': 'Error del servidor. Por favor, intenta más tarde.',
    'auth.error.network': 'Error de conexión. Verifica tu internet.',
    'auth.success.login': '¡Inicio de sesión exitoso!',
    'auth.error.login': 'Error en el inicio de sesión. Inténtalo de nuevo.',

    // Dashboard
    'dashboard.empty.title': 'Aún no tienes fincas',
    'dashboard.empty.description': 'Comienza tu viaje cafetero creando tu primera finca. Haz clic en el botón "Agregar Finca" en la barra lateral para empezar.',

    // Sidebar
    'sidebar.addFarm': 'Agregar Finca',

    // Farm Management
    'farm.edit': 'Editar',
    'farm.delete': 'Eliminar',
    'farm.actions': 'Acciones de la finca',
    'farm.location.missingWeather': 'Sin ubicación · ubícala para ver el clima',
    'farm.meta.sections': '{n} secciones',
    'farm.meta.sections.one': '1 sección',

    // Weather: OpenWeather's fifteen `main` codes. The API always serves them in English, so
    // they are translated here and the app's switch decides the language.
    'weather.condition.clear': 'Despejado',
    'weather.condition.clouds': 'Nublado',
    'weather.condition.rain': 'Lluvia',
    'weather.condition.drizzle': 'Llovizna',
    'weather.condition.thunderstorm': 'Tormenta',
    'weather.condition.snow': 'Nieve',
    'weather.condition.mist': 'Neblina',
    'weather.condition.fog': 'Niebla',
    'weather.condition.haze': 'Bruma',
    'weather.condition.dust': 'Polvo',
    'weather.condition.smoke': 'Humo',
    'weather.condition.sand': 'Arena',
    'weather.condition.ash': 'Ceniza',
    'weather.condition.squall': 'Ráfagas',
    'weather.condition.tornado': 'Tornado',
    'farm.delete.title': 'Eliminar finca',
    // Name what gets lost. "All associated data" says nothing: nobody knows what counts as
    // associated until it is gone.
    'farm.delete.lede.before': 'Vas a eliminar',
    'farm.delete.lede.after':
      'y todas sus secciones. Esta acción no se puede deshacer: se borran sus lecturas y recomendaciones.',
    'farm.delete.typeName': 'Escribe el nombre para confirmar',
    'farm.delete.button': 'Eliminar definitivamente',
    'farm.viewMap': 'Ver Mapa',
    'nav.main': 'Navegación principal',
    'dashboard.summary': 'resumen del día',
    'greeting.morning': 'Buenos días, {name}',
    'greeting.afternoon': 'Buenas tardes, {name}',
    'greeting.evening': 'Buenas noches, {name}',
    'banner.crop': '{n} fincas piden atención',
    // KEEP THESE FOUR. `StatusBanner` builds the singular forms with `t(`${key}.one`)`, from a
    // VARIABLE, so the literal appears nowhere and a sweep for unused keys does not see them.
    // Delete them and the panel renders "banner.device.one" verbatim on screen.
    'banner.crop.one': '1 finca pide atención',
    'banner.device.one': '1 finca con equipo por revisar',
    'banner.setup.one': '1 finca espera configuración',
    'banner.ok.one': 'Tu finca está bien',
    'banner.device': '{n} fincas con equipo por revisar',
    'banner.setup': '{n} fincas esperan configuración',
    'banner.ok': 'Tus {n} fincas están bien',
    'banner.detail.ok': '{n} al día',
    'banner.detail.device': '{n} por revisar',
    'banner.detail.setup': '{n} por configurar',
    'farmsMap.title': 'Dónde están tus fincas',
    'farmsMap.missing': '{n} todavía no están en el mapa',
    'farmsMap.hint': 'El color de la chincheta es el mismo de la tarjeta. Toca una para abrir la finca.',
    'farmsMap.empty': 'Ninguna de tus fincas está ubicada todavía. Ubica una y aparecerá aquí.',
    'dashboard.error.title': 'No pudimos cargar tus fincas',
    'dashboard.error.body': 'Revisa tu conexión. Tus datos están a salvo: solo no se pudieron traer ahora.',
    'dashboard.error.retry': 'Reintentar',
    'farm.state.cropAlert': '{n} piden atención',
    'farm.state.silent': '{n} sin reportar',
    'farm.state.noHub': '{n} sin sensor',
    'farm.state.noSections': 'Sin secciones',
    // The farm measures, just not in every plot: said without moving it out of the calm group.
    'farm.state.partial': '{r} de {n} midiendo',
    'dashboard.state.unavailable':
      'No se pudo calcular el estado de tus fincas. La lista está; el diagnóstico no.',
    'farmsMap.openSections': 'Ver secciones',
    'farm.filter.label': 'Filtrar por grupo',
    'farm.filter.all': 'Todas',
    'farm.search.label': 'Buscar una finca por nombre',
    'farm.search.placeholder': 'Nombre de la finca…',
    'farm.search.close': 'Cerrar la búsqueda',
    'farm.search.noMatch': 'Ninguna finca coincide con «{q}».',
    'farm.tier.crop': 'Piden atención',
    'farm.tier.device': 'Revisa el equipo',
    'farm.tier.setup': 'Por configurar',
    'farm.tier.ok': 'Al día',
    'farm.tier.crop.hint': 'El café está pidiendo algo hoy.',
    'farm.tier.device.hint': 'Estaban midiendo y se callaron. Conviene revisarlas.',
    'farm.tier.setup.hint': 'No hay nada roto: falta instalar o ubicar.',
    'farm.tier.ok.hint': 'Midiendo y dentro de lo esperado.',
    'map.layer': 'Capa del mapa',
    'farm.map.unlocated.title': 'Esta finca todavía no está ubicada',
    'farm.map.unlocated.body': 'Edita la finca y marca su posición para verla en el mapa.',
    'farm.map.approximate.title': 'Ubicación aproximada',
    'farm.map.approximate.body': 'La chincheta marca el distrito, no la parcela. Edita la finca y arrástrala hasta tu cafetal para precisarla.',
    'map.layer.street': 'Mapa',
    'map.layer.satellite': 'Satélite',
    'farm.location.noResults': 'No encontramos ese lugar. Prueba con el distrito o el caserío más cercano.',
    'notFound.farm.title': 'Esa finca ya no está',
    'notFound.section.title': 'Esa sección ya no está',
    'notFound.hub.title': 'Ese hub ya no está',
    'notFound.body': 'Puede que se haya eliminado, o que el enlace apunte a algo que ya no existe.',
    'nav.farms': 'Fincas',
    'nav.hubs': 'Hubs',
    'nav.logout': 'Cerrar sesión',
    'nav.goHome': 'Ir a fincas',
    'nav.profile': 'Perfil',
    'role.manager': 'Administrador',
    'role.farmer': 'Agricultor',
    // Profile
    'profile.title': 'Mi perfil',
    'profile.lede': 'Tu cuenta y cómo te llegan las alertas urgentes.',
    'profile.account': 'Cuenta',
    'profile.sms.title': 'Alertas por SMS',
    'profile.sms.hint': 'Cuando una alerta crítica necesita acción hoy y tu finca no tiene internet, podemos enviártela por SMS.',
    'profile.phone.label': 'Número de teléfono',
    'profile.phone.invalid': 'Ingresa el número en formato internacional, por ejemplo +51987654321.',
    'profile.optin.label': 'Recibir alertas por SMS',
    'profile.verified': 'Verificado',
    'profile.unverified': 'Sin verificar',
    'profile.alertsActive': 'Recibirás alertas por SMS.',
    'profile.save': 'Guardar',
    'profile.saved': 'Guardado.',
    'profile.saveError': 'No se pudo guardar. Inténtalo de nuevo.',
    'profile.verify.title': 'Verifica tu número',
    'profile.verify.hint': 'Enviaremos un código a {phone} para confirmar que es tuyo.',
    'profile.verify.send': 'Enviar código',
    'profile.verify.sent': 'Código enviado.',
    'profile.verify.sendError': 'No se pudo enviar el código. Inténtalo de nuevo.',
    'profile.verify.confirm': 'Verificar',
    'profile.verify.ok': 'Número verificado.',
    'profile.verify.error': 'Ese código no funcionó. Pide uno nuevo.',
    'profile.verify.locked': 'Demasiados intentos. Pide un código nuevo.',
    'access.managerOnly.title': 'Solo el administrador',
    'access.managerOnly.body': 'Esta sección la lleva quien administra la finca. Si necesitas algo de aquí, avísale.',
    'access.managerOnly.action': 'Volver a mis fincas',
    // Age is worded by `sensors.time.*` through `relativeLabel`; only the caption lives here.
    // One source for the wording, or this view and the section list end up describing the same
    // gap in different words.
    'farm.lastReading.label': 'Última lectura:',
    'farm.location.or': 'o',
    'farm.location.useCurrent': 'Estoy en la finca ahora',
    'farm.location.locating': 'Obteniendo tu posición…',
    'farm.location.noGeolocation': 'Este dispositivo no puede compartir su posición. Usa el buscador.',
    'farm.location.locateFailed': 'No se pudo obtener tu posición. Usa el buscador.',
    'farm.location.approximateNote': 'Es el distrito, no la finca. Sirve para el clima; arrastra la chincheta para el mapa.',
    'farm.location.exactNote': 'Punto exacto guardado · {lat}, {lng}',
    'farm.location.dragHint': 'Arrastra la chincheta hasta tu cafetal, o toca el mapa.',
    'farm.location.emptyHint': 'Busca o usa tu posición para ubicar la finca en el mapa.',
    'boundary.draw': 'Dibujar el contorno',
    'boundary.editWithArea': 'Contorno dibujado · {area}',
    'boundary.title': 'Dibuja el contorno de tu finca',
    'boundary.hint': 'Toca el mapa para poner las esquinas. Cierra tocando la primera o pulsa Terminar.',
    'boundary.area': 'Superficie',
    'boundary.area.pending': 'Pon al menos 3 esquinas',
    'boundary.undo': 'Deshacer',
    'boundary.reset': 'Empezar de nuevo',
    'boundary.finish': 'Terminar',
    'boundary.cancel': 'Cancelar',
    'boundary.save': 'Guardar contorno',
    'farm.location.unset': 'Sin ubicación',
    'farm.location.fix': 'Ubicar finca',
    'farm.success.delete': '¡Finca eliminada exitosamente!',
    'farm.error.delete': 'Error al eliminar la finca. Inténtalo de nuevo.',
    'farm.success.update': '¡Finca actualizada exitosamente!',
    'farm.error.update': 'Error al actualizar la finca. Inténtalo de nuevo.',
    'farm.success.create': '¡Finca creada exitosamente!',
    'farm.error.create': 'Error al crear la finca. Inténtalo de nuevo.',
    'farm.add.title': 'Agregar Nueva Finca',
    'farm.add.button': 'Agregar Finca',
    'farm.edit.title': 'Editar Finca',
    'farm.edit.button': 'Actualizar Finca',
    'farm.name': 'Nombre de la Finca',
    'farm.name.placeholder': 'Ingresa el nombre de la finca',
    'farm.name.validation': 'Por favor ingresa un nombre de finca',
    'farm.name.length.min': 'El nombre de la finca debe tener al menos 2 caracteres',
    'farm.name.length.max': 'El nombre de la finca no puede exceder 50 caracteres',
    'farm.location': 'Ubicación',
    'farm.location.placeholder': 'Busca el caserío o distrito…',
    'farm.location.validation': 'Por favor ingresa una ubicación',
    'farm.altitude': 'Altitud (metros)',
    'farm.altitude.placeholder': 'Ingresa la altitud en metros',
    'farm.altitude.range': 'Ingresa una altitud entre {min} y {max} m',
    'farm.altitude.optional': 'Opcional. Si la dejas en blanco, no ajustamos el diagnóstico por altitud.',
    'farm.altitude.deriving': 'Consultando la altitud de este punto…',
    'farm.altitude.derived': 'Rellenada desde el mapa: {metres} m. Puedes corregirla si la sabes exacta.',
    'farm.altitude.mismatch': 'El mapa da {metres} m para este punto, {diff} m de diferencia con lo que escribiste. Puede que el punto y la altitud no sean del mismo sitio.',
    'farm.altitude.noCoords': 'Ubica la finca en el mapa y te sugerimos la altitud.',

    // Farm Sections
    'sections.hub.labelOptional': 'Hub que medirá esta sección (opcional)',
    'sections.hub.optionalHint': 'También puedes enlazarlo después desde la tarjeta de la sección.',
    'sections.hub.noneAvailableShort': 'No hay hubs disponibles',
    'sections.hub.assignAfterCreateFailed': 'La sección se creó, pero el hub no se pudo enlazar. Puedes asignarlo desde la tarjeta.',
    'sections.hub.label': 'Hub que mide esta sección',
    'sections.hub.remove': 'Quitar',
    'sections.hub.removed': 'Hub retirado de esta sección',
    'sections.hub.assign': 'Asignar',
    'sections.hub.assigned': 'Hub asignado',
    'sections.hub.assignError': 'No se pudo asignar el hub',
    'sections.hub.selectPlaceholder': 'Elige un hub',
    'sections.hub.noneAvailable': 'No hay hubs sin asignar. Un hub se registra solo en su primera lectura.',
    'sections.hub.installedSince': 'Instalado desde el {date}',
    'sections.coverage.reporting': 'Recibiendo datos',
    'sections.coverage.stale': 'Sin datos recientes',
    'sections.coverage.noHub': 'Sin hub',
    'nav.backTo': 'Volver a {destination}',
    'sections.title': 'Secciones de la Finca',
    'sections.empty.title': 'Aún no hay secciones',
    'sections.empty.description': 'Agrega secciones para organizar mejor tu finca.',
    'sections.add': 'Agregar Sección',
    'sections.actions': 'Acciones de la sección',
    'sections.summary.reporting': '{n} reportando',
    'sections.summary.stale': '{n} sin datos recientes',
    'sections.summary.noHub': '{n} sin sensor',
    'sections.card.allGood': 'Todo en orden',
    'sections.edit': 'Editar Sección',
    'sections.edit.button': 'Actualizar Sección',
    'sections.delete': 'Eliminar Sección',
    'sections.delete.title': 'Eliminar sección',
    'sections.delete.lede.before': 'Vas a eliminar',
    'sections.delete.lede.after':
      'Esta acción no se puede deshacer: se borran sus lecturas y las recomendaciones calculadas sobre ellas.',
    'sections.delete.typeName': 'Escribe el nombre para confirmar',
    'sections.delete.button': 'Eliminar definitivamente',
    'sections.name': 'Nombre de la Sección',
    'sections.name.placeholder': 'Ingresa el nombre de la sección',
    'sections.name.validation': 'Por favor ingresa un nombre de sección',
    'sections.name.length.min': 'El nombre de la sección debe tener al menos 2 caracteres',
    'sections.name.length.max': 'El nombre de la sección no puede exceder 50 caracteres',
    'sections.growthStage': 'Tipo de Etapa de Crecimiento',
    'sections.growthStage.placeholder': 'Selecciona etapa de crecimiento',
    'sections.growthStage.validation': 'Por favor selecciona una etapa de crecimiento',
    'sections.success.create': '¡Sección creada exitosamente!',
    'sections.success.update': '¡Sección actualizada exitosamente!',
    'sections.success.delete': '¡Sección eliminada exitosamente!',
    'sections.error.create': 'Error al crear la sección.',
    'sections.error.update': 'Error al actualizar la sección.',
    'sections.error.delete': 'Error al eliminar la sección.',

    // Section Types
    'sectionType.plantula': 'Plántula',
    'sectionType.vegetativo': 'Vegetativo',
    'sectionType.floracion': 'Floración',
    'sectionType.fructificacion': 'Fructificación',
    'sectionType.cosecha': 'Cosecha',
    'sectionType.maduracion': 'Maduración',

    // Section Detail

    // Section Data

    // Section detail -- verdict ("answer first")
    'section.verdict.eyebrow.one': '1 cosa que atender hoy',
    'section.verdict.eyebrow.many': '{count} cosas que atender hoy',
    'section.verdict.showSteps': 'Ver cómo hacerlo',
    'section.verdict.hideSteps': 'Ocultar los pasos',
    'section.verdict.stepByStep': 'Paso a paso',
    // The connectors add NO judgement: the engine's dose already carries its basis
    // ("40 g/plant", "~2 kg/ha"). Writing "per plant" here would turn a per-hectare dose into
    // something else.
    'section.verdict.step.get': 'Consigue {product}.',
    'section.verdict.step.apply': 'Aplica {dose}.',
    'section.verdict.step.applyWithMethod': 'Aplica {dose}, al {method}.',
    'section.verdict.step.timing': 'Hazlo {timing}.',
    'section.verdict.techHint':
      '¿Eres técnico? Cambia a Agrónomo arriba para ver dosis exactas y el porqué.',
    'section.verdict.allGood.headline': 'Tu cafetal está bien hoy',
    'section.verdict.allGood.seen': 'Lo miramos {when} · no hay nada que atender',
    'section.verdict.stage': 'Etapa: {stage}',
    'section.verdict.next': 'Lo próximo',

    // Section detail -- density switch (Manager only)
    'section.density.label': 'Ver como',
    'section.density.agronomist': 'Agrónomo',
    'section.density.farmer': 'Agricultor',

    // Section detail -- live sensor panel
    'section.sensor.title': 'Datos del sensor',
    'section.sensor.cadence': 'Miramos tu café cada 2 minutos',
    'section.sensor.seen': 'visto {when}',
    'section.sensor.nextIn': 'Próxima en {time}',
    'section.sensor.noAlert': 'Sin alerta',
    'section.sensor.unreliable': 'Sin dato fiable',
    'section.sensor.unreliableNote':
      'El sensor está fuera de su rango de confianza. No se puede saber si está bien o mal — no es ni verde ni rojo.',
    'section.sensor.noReference':
      'No se pudieron cargar las bandas de referencia: los valores se muestran sin veredicto.',

    // Section detail -- states with no diagnosis
    'section.state.noHub.title': 'Este lote todavía no se mide',
    'section.state.noHub.body':
      'Todavía no hay un equipo midiendo aquí, así que aún no podemos decirte cómo va. No es un error: solo falta instalarlo.',
    'section.state.noHub.assign': 'Asignar un hub',
    'section.state.noHub.askManager': 'Pídele a quien administra la finca que le instale un equipo.',
    'section.state.silent.eyebrow': 'El sensor no reporta',
    'section.state.silent.title': 'Sin lecturas desde {since}',
    'section.state.silent.body':
      'Preferimos no darte un consejo con datos viejos. Puede ser la batería, la señal, o que el equipo se apagó.',
    'section.state.silent.lastKnown': 'La última vez que supimos de tu café: {when}{vitals}',
    'section.state.neverReported.title': 'El hub todavía no ha reportado',
    'section.state.neverReported.body':
      'El equipo está asignado a esta sección pero aún no ha enviado ninguna lectura, así que todavía no hay nada que diagnosticar.',

    // Section detail -- recommendation cards
    'section.rec.action': 'Acción',
    'section.rec.product': 'Producto',
    'section.rec.dose': 'Dosis',
    'section.rec.method': 'Método',
    'section.rec.methodValue': 'al {method}',
    'section.rec.timing': 'Momento',
    'section.rec.saving': 'Ahorra recursos',
    'section.rec.forecast': 'Previsión ~{hours} h',
    'section.rec.provisional': 'Dato provisional',
    'section.rec.tag.referential': 'Referencial',
    'section.rec.tag.coordinate': 'Coordinar antes',
    'section.rec.tag.confirm': 'Confirmar primero',
    'section.rec.tech.show': 'Ver detalle técnico',
    'section.rec.tech.hide': 'Ocultar detalle técnico',
    'section.rec.tech.label': 'Técnico',
    'section.rec.verify': 'Verificar',
    'section.rec.referral': 'Derivación',
    'section.rec.note': 'Nota',
    'section.rec.reminders': 'Recordatorios ({count})',
    'section.rec.allGood': '{subjects}: todo en orden.',
    'section.rec.filterEmpty': 'No hay tarjetas de esta categoría en esta vista.',
    'section.rec.clearFilter': 'Quitar filtro',
    'section.rec.filterBy': 'Filtrar por {noun}',
    'section.rec.sev.critical': 'crítico',
    'section.rec.sev.critical.plural': 'críticos',
    'section.rec.sev.alert': 'alerta',
    'section.rec.sev.alert.plural': 'alertas',
    'section.rec.sev.warning': 'aviso',
    'section.rec.sev.warning.plural': 'avisos',
    'section.rec.sev.info': 'info',
    'section.rec.sev.info.plural': 'info',
    // Fallback for an older record that carries no `actionability_label` from the engine.
    'section.rec.actionability.direct': 'Puedes aplicarlo ahora',
    'section.rec.actionability.verify': 'Verifica primero',
    'section.rec.actionability.consult': 'Consulta al técnico',
    'section.rec.actionability.structural': 'Medida de fondo',
    'section.rec.actionability.monitor': 'Observa y espera',
    'section.rec.actionability.none': 'Todo en orden',

    // Recommendations
    'recommendations.title': 'Recomendaciones',
    'recommendations.noAvailable': 'No hay recomendaciones disponibles',

    // Card Data (Sensor Data)
    'cardData.noData': 'No hay datos disponibles',
    'cardData.temperature': 'Temperatura',
    'cardData.airHumidity': 'Humedad del Aire',
    'cardData.soilHumidity': 'Humedad del Suelo',
    'cardData.precipitation': 'Precipitación',
    'cardData.nitrogen': 'Nitrógeno',
    'cardData.phosphorus': 'Fósforo',
    'cardData.potassium': 'Potasio',

    // Sensors & Devices
    //
    // Hubs — the inventory. Each row is a HUB (one ESP32 per section, averaging what its Nodes
    // send), not a single sensor: the instruments (NPK CWT-SOIL-NPK-S, DHT22, capacitive soil
    // moisture v1.2, FC-37) live in the Nodes and are not inventoried.
    'hubs.eyebrow': 'Inventario · solo Manager',
    'hubs.title': 'Hubs',
    'hubs.lede':
      'Un hub por sección; la asignación es temporal y guarda historial. El estado del dispositivo es un hecho técnico, no un juicio del cultivo.',
    'hubs.readOnly':
      'El equipo aparece aquí solo cuando empieza a enviar datos. Tú no lo das de alta: solo lo pones en una parcela o lo retiras.',
    // State DERIVED from the last reading, not the stored `status`. See `utils/hubState`.
    'hubs.state.reporting': 'Reportando',
    'hubs.state.silent': 'Sin señal',
    'hubs.state.unassigned': 'Sin asignar',
    'hubs.state.never': 'Nunca reportó',
    'hubs.stats.total': 'Hubs en inventario',
    'hubs.stats.reporting': 'Reportando',
    'hubs.stats.reporting.hint': 'enviando hace poco',
    'hubs.stats.silent': 'Sin señal',
    'hubs.stats.silent.hint': 'callado más de medio día',
    'hubs.stats.unassigned': 'Sin asignar',
    'hubs.stats.unassigned.hint': 'sin parcela todavía',
    // Short form for the phone pills, where the figure comes first: "1 reportando".
    //
    // All three are INVARIABLE on purpose. A form like "1 activo" needs a plural at zero and at
    // two, which would force a per-language agreement rule; "reportando" works for any figure and
    // is already the word the desktop card uses.
    'hubs.stats.reporting.short': 'reportando',
    'hubs.stats.silent.short': 'sin señal',
    'hubs.stats.unassigned.short': 'sin asignar',
    'hubs.allHubs': 'Todos los hubs',
    'hubs.row.noSection': 'Sin parcela',
    'hubs.empty.title': 'No hay hubs que mostrar',
    'hubs.empty.none': 'Los hubs aparecen aquí en su primera lectura.',
    'hubs.empty.filtered': 'Ninguno de tus hubs está ahora mismo en ese estado.',
    'hubs.empty.clear': 'Ver todos los hubs',
    // Hub detail
    'hubs.detail.title': 'Detalle del hub',
    'hubs.detail.lastReading': 'Última lectura',
    'hubs.detail.cadence': 'Cada cuánto reporta',
    'hubs.detail.cadenceValue': 'cada {minutes} min',
    'hubs.detail.assignment': 'Asignación actual',
    'hubs.detail.since': 'Instalado el {date}',
    'hubs.detail.assign': 'Asignar',
    'hubs.detail.assignTo': 'Asignar a una sección',
    'hubs.detail.reassign': 'Reasignar',
    'hubs.detail.reassignTo': 'Mover a otra sección',
    'hubs.detail.remove': 'Retirar de la sección',
    'hubs.detail.assigned': 'Hub asignado',
    'hubs.detail.reassigned': 'Hub movido',
    'hubs.detail.removed': 'Hub retirado de la sección',
    'hubs.detail.failed': 'No se pudo hacer',
    'hubs.detail.noFreeSections': 'Todas las secciones ya tienen hub.',
    'hubs.detail.unassignedWhy':
      'Está enviando datos, pero no están ligados a ninguna parcela, así que nadie los ve. Ponlo en una parcela para aprovecharlos.',
    'hubs.detail.history': 'Historial de asignaciones',
    'hubs.detail.historyEmpty': 'Este hub todavía no ha estado en ninguna sección.',
    'hubs.detail.historyWhy':
      'Guardamos por dónde ha pasado el equipo: así las lecturas de antes siguen contando para la parcela donde se tomaron.',
    'hubs.detail.installed': 'instalado',
    'hubs.detail.now': 'hoy',
    'hubs.detail.sectionGone': 'Sección eliminada',
    'hubs.detail.confirmMove': 'Mover',
    // History labels describe the PERIOD, not the device. "Installed" is what the assignment
    // above says; here what matters is whether the stretch is still open.
    'hubs.detail.periodOpen': 'activa',
    'hubs.detail.periodClosed': 'cerrada',
    'sensors.card.copied.announce': 'MAC del hub copiada al portapapeles',
    'sensors.card.copyCode': 'Copiar la MAC del hub',
    'sensors.time.minutes': 'hace {count} min',
    'sensors.time.hours': 'hace {count} h',
    // The singular gets its own key: "hace 1 días" would sit right above the diagnosis.
    'sensors.time.day': 'hace 1 día',
    'sensors.time.days': 'hace {count} días',
    'sensors.time.never': 'Nunca reportó',
    // MIND THE NAME: `sensors.*` is the endpoint (/sensors), not what the row represents. Each
    // inventory row is a HUB (one ESP32 per section, averaging what its Nodes send), not a single
    // sensor. The instruments (NPK CWT-SOIL-NPK-S, DHT22, capacitive soil moisture v1.2, FC-37)
    // live in the Nodes and are not inventoried.
    'sensors.error.loading': 'Error al cargar el inventario de hubs',
    'sensors.tryAgain': 'Intentar de Nuevo',

    // Reports
    'reports.title': 'Análisis histórico',
    'reports.eyebrow': 'Reportes · sólo Manager',
    'reports.pickFarm': 'Elige una finca para ver su histórico.',

    // Atajos de rango
    'reports.range.7d': '7 días',
    'reports.range.30d': '30 días',
    'reports.range.90d': '90 días',
    'reports.range.custom': 'Personalizado',

    // Aviso de rango real
    'reports.rangeNotice':
      'Pediste {requested}, pero sólo hay datos entre {actual}. El gráfico muestra el periodo con lecturas reales, no el pedido.',

    // Stats strip
    'reports.stats.readings': 'Lecturas',
    'reports.stats.readings.hint': 'en el periodo',
    // "Model" and "band" are our words, not the user's: they name the rule engine and its
    // optimal range. A Manager does not have a model, they have a coffee plot — and the rest of
    // this screen names things they can observe ("última lectura", "Días con lluvia").
    'reports.stats.inBand': 'Tiempo en rango',
    'reports.stats.inBand.hint': 'dentro del rango de referencia',
    'reports.stats.inBand.noModel': 'No se pudo consultar la referencia',
    'reports.stats.rainDays': 'Días con lluvia',
    'reports.stats.rainDays.hint': 'registrada en campo',
    'reports.stats.alerts': 'Alertas emitidas',
    'reports.stats.alerts.hint': 'diagnósticos que pidieron actuar',
    'reports.stats.alerts.unavailable': 'No se pudo consultar',
    'reports.stats.uptime': 'Días con datos',
    'reports.stats.uptime.hint': '{days} de {total} días',

    // The header line of every metric
    // The four slots every metric fills, in the same order and with the same opening words.
    // Unlabelled, "58.5 %" gives no clue whether it is the window's last reading or a share of
    // the period.
    'reports.chart.lastReading': 'Última lectura',
    // Short, because it is a label aligned against "Modelo". That it describes the period comes
    // from the contrast with the line above, which opens with "última lectura".
    'reports.chart.measuredIn': 'Medido',
    'reports.chart.model': 'Referencia',
    'reports.chart.acceptedRange': 'Rango aceptado',
    // Space before the sign, like the rest of the line: threshold values arrive from the engine
    // as "85 %", and "el 81% del periodo" beside them reads uneven in the same sentence.
    'reports.chart.coverInRange': 'Dentro del rango el {pct} % del periodo',
    'reports.chart.coverNoCross': 'Sin cruzar umbrales el {pct} % del periodo',
    'reports.chart.thresholdFrom': 'Desde',
    'reports.chart.thresholdBelow': 'Por debajo de',
    'reports.chart.noFixedRange': 'Sin rango fijo',
    'reports.chart.observed': 'Medido',
    // Whole words: the line has room to spare, and "prom · mín · máx" makes the reader decode
    // three abbreviations to save eleven characters.
    'reports.chart.avg': 'Promedio',
    'reports.chart.min': 'mínimo',
    'reports.chart.max': 'máximo',

    // Leyenda
    'reports.legend.measured': 'Valor medido',
    'reports.legend.band': 'Rango aceptado',
    'reports.legend.threshold': 'Umbral de riesgo (punteado)',
    'reports.legend.rain': 'Lluvia detectada',
    'reports.legend.hint': 'Pasa el cursor por el gráfico para leer fecha y valor.',

    // Rain, and the sampling artefact it carries
    // "Detected", not "it rained": the FC-37 answers yes or no at the sampling instant, so a
    // shower between two readings leaves no trace and the wording must not promise otherwise.
    'reports.rain.summary': 'Se detectó lluvia {rained} de {total} días',
    'reports.rain.between': 'lluvia entre las {from} y las {to}',
    'reports.rain.spells': 'lluvia en {n} momentos, de {from} a {to}',
    'reports.rain.readings': '{rainy} de las {total} lecturas del día',
    'reports.rain.none': 'sin lluvia detectada',
    'reports.note.tag': 'Bueno saberlo',
    'reports.note.title': 'La lluvia infla las lecturas de nutrientes',
    'reports.note.body':
      'Cuando llueve, N, P y K aparecen más altos por la humedad del suelo, no porque haya más nutriente. Antes de leer un pico como una mejora, compáralo con los días de lluvia de arriba.',

    // Regional rainfall in millimetres. The label carries provenance AND uncertainty: without
    // it, a figure from a 9 km cell reads as if it came from the plot.
    'reports.regionalRain.title': 'Lluvia en la zona (modelo regional)',
    'reports.regionalRain.total': '{mm} mm en el periodo · barra más alta {max} mm',
    'reports.regionalRain.caveat':
      'Estos milímetros no salen de tu hub: su sensor sólo dice si llovió, no cuánto. Vienen de un modelo del clima de 9 km que cubre la zona, así que describen la zona y no tu parcela. La altura de las barras es relativa al día más lluvioso que se ve, así que dos periodos no se pueden comparar a ojo. Tómalos como referencia, no como medición: para el mismo punto, modelos distintos llegan a diferir al triple, y ninguno está contrastado con pluviómetro aquí.',
    'reports.regionalRain.loading': 'Cargando la lluvia de la zona…',
    'reports.regionalRain.unavailable': 'Ahora mismo no se puede consultar la lluvia de la zona. El reporte de arriba no se ve afectado: es todo dato medido.',
    'reports.regionalRain.noCoords': 'Ubica esta finca en el mapa y te mostramos también la lluvia que registró la zona, en milímetros. Tu hub sólo dice si llovió, no cuánto.',

    // Export
    'reports.export.title': 'Exportar este reporte',
    'reports.export.soon': 'pronto',
    'reports.export.success': 'Reporte exportado a CSV exitosamente',
    'reports.dateRange': 'Rango de Fechas',
    'reports.farmFilter': 'Filtrar por Finca',
    'reports.sectionFilter': 'Filtrar por Sección',
    'reports.dataType': 'Tipo de Datos',
    'reports.dataTypes.all': 'Todos los Datos',
    'reports.dataTypes.environmental': 'Ambiental',
    'reports.dataTypes.soil': 'Datos del Suelo',
    'reports.dataTypes.nutrients': 'Nutrientes',
    'reports.placeholders.selectFarm': 'Selecciona una finca',
    'reports.placeholders.allSections': 'Todas las secciones',
    'reports.error.loadingFarms': 'Error al cargar las fincas',
    'reports.error.loadingSections': 'Error al cargar las secciones',
    'reports.error.generating': 'Error al generar el reporte',
    'reports.error.failed': 'Error al generar el reporte',
    'reports.chart.title': 'Visualización de Datos',
    'reports.chart.noData': 'No hay datos disponibles para visualización',
    'reports.chart.temperature': 'Temperatura (°C)',
    'reports.chart.airHumidity': 'Humedad del aire (%)',
    'reports.chart.soilHumidity': 'Humedad del suelo (%)',
    'reports.chart.nitrogen': 'Nitrógeno (mg/kg)',
    'reports.chart.phosphorus': 'Fósforo (mg/kg)',
    'reports.chart.potassium': 'Potasio (mg/kg)',
    'reports.chart.precipitation': 'Lluvia',
    'reports.chart.filter.all': 'Todos',
    'reports.chart.rain.hint': 'Sombrea los periodos en que llovió. Es relevante para humedad de suelo, humedad de aire y nitrógeno.',
    'reports.chart.showingAll': 'Mostrando las {total} lecturas',
    // Zooming into a quiet stretch can leave a single reading, and "las 1 lecturas" reads as a
    // bug even though the number is right.
    'reports.chart.showingOne': 'Mostrando la única lectura de este tramo',
    'reports.chart.showingSome': 'Mostrando {drawn} de {total} lecturas, conservando los picos',
    'reports.chart.zoom.reset': 'Ver todo el periodo',
    'reports.chart.emptyPeriod': 'El {pct}% del periodo no tiene lecturas',
    'reports.chart.nav.hint': 'Arrastra la ventana para acercarte; tira de sus bordes para ensancharla',
    'reports.chart.nav.label': 'Periodo en pantalla',
    'reports.table.title': 'Tabla de Datos',
    'reports.table.timestamp': 'Marca de Tiempo',
    'reports.table.farm': 'Finca',
    'reports.table.section': 'Sección',
    'reports.table.temperature': 'Temperatura',
    'reports.table.tempShort': 'Temp',
    'reports.table.airHumidity': 'Humedad del Aire',
    'reports.table.airHumidityShort': 'H. Aire',
    'reports.table.soilHumidity': 'Humedad del Suelo',
    'reports.table.soilHumidityShort': 'H. Suelo',
    'reports.table.precipitation': 'Precipitación',
    'reports.table.precipitationShort': 'Lluvia',
    'reports.table.searchPlaceholder': 'Buscar fincas, secciones o fechas',
    'reports.table.searchShort': 'Buscar...',
    'reports.table.total': 'Total',
    'reports.table.perPage': '/ página',
    'reports.table.reveal': 'Ver las {n} lecturas',
    'reports.table.hide': 'Ocultar la tabla',
    'reports.noData': 'No hay datos disponibles para el período seleccionado',

    // Weather

    // Modals

    // Navigation
    'nav.dashboard': 'Dashboard',
    'nav.reports': 'Reportes',

    // Common
    'common.loading': 'Cargando...',
    'common.save': 'Guardar',
    'common.cancel': 'Cancelar',
    'common.yes': 'Sí',
    'common.no': 'No',
    'common.refresh': 'Actualizar',
    'common.back': 'Volver',
    'common.changeLanguage': 'Cambiar idioma',
    /** For what is planned but not working yet. Shown disabled rather than hidden. */
    'common.soon': 'pronto',

    // ── Crop log ─────────────────────────────────────────────────────────────────────────
    'log.title': 'Bitácora del cultivo',
    'log.lede':
      'Anota cuándo pasan las cosas del cafetal. Con esas fechas los avisos salen en el momento correcto y no por aproximación.',
    'log.record': 'Registrar',
    'log.when': '¿Cuándo pasó?',
    'log.note': 'Nota (opcional)',
    'log.addNote': 'Añadir nota',
    'log.saving': 'Guardando…',
    'log.loading': 'Cargando…',
    'log.pending': 'Sin registrar todavía',
    'log.seeAll': 'Ver historial completo ({count})',
    'log.onboard.body':
      'Todavía no hay registros. Con dos anotaciones al año —la floración y el fin de cosecha— el sistema deja de aproximar por etapa y te avisa en la fecha correcta.',
    'log.onboard.flowering': '→ cuándo el grano puede ser brocado',
    'log.onboard.harvest': '→ cuándo toca el repase',
    'log.onboard.action': 'Anotar la primera',

    // Event types. Colour axis 3: categorical, none of them is "bad".
    'log.type.flowering.label': 'Floración',
    'log.type.flowering.hint':
      'Arranca el conteo para saber cuándo el grano puede ser atacado por la broca.',
    'log.type.flowering.question': '¿Cuándo floreció?',
    'log.type.flowering.placeholder': 'p. ej. floración pareja en todo el lote',
    'log.type.fertilization.label': 'Abonada',
    'log.type.fertilization.hint':
      'Sirve para avisarte del análisis de suelo y del riesgo de que la lluvia lave el abono.',
    'log.type.fertilization.question': '¿Cuándo abonaste?',
    'log.type.fertilization.placeholder': 'p. ej. bocashi en el lote alto',
    'log.type.harvest_end.label': 'Fin de cosecha',
    'log.type.harvest_end.hint':
      'A las 2–3 semanas te recordamos el repase (recoger los granos que quedaron).',
    'log.type.harvest_end.question': '¿Cuándo terminó la cosecha?',
    'log.type.harvest_end.placeholder': 'p. ej. última pasada, quedó grano en las orillas',
    'log.type.soil_sampling.label': 'Muestreo de suelo',
    'log.type.soil_sampling.hint': 'Reinicia el recordatorio de análisis (se recomienda cada 2 años).',
    'log.type.soil_sampling.question': '¿Cuándo tomaste la muestra?',
    'log.type.soil_sampling.placeholder': 'p. ej. muestra enviada al laboratorio',
    'log.type.liming.label': 'Encalado',
    'log.type.liming.hint': 'Reinicia el recordatorio de encalado.',
    'log.type.liming.question': '¿Cuándo encalaste?',
    'log.type.liming.placeholder': 'p. ej. cal dolomítica en bandas',

    // Consequences. `statusFor` decides the tone; only the text lives here.
    'log.status.flowering.stale': 'Registro antiguo · anota la nueva floración',
    'log.status.flowering.countdown': 'Grano brocable en ~{days} días',
    'log.status.flowering.since': 'Grano brocable desde {date}',
    'log.status.harvest.window': 'Repase del {from} al {to}',
    'log.status.harvest.now': 'Toca el repase ahora',
    'log.status.harvest.past': 'Ventana de repase terminada',
    'log.status.sampling.due': 'Toca renovar el análisis',
    'log.status.sampling.ok': 'Al día · próximo en {year}',
    'log.status.liming.due': 'Conviene revisar el encalado',
    'log.status.liming.ok': 'Al día · próximo en {year}',
    'log.status.fertilization.from': 'Muestreo de suelo desde {date}',
    'log.status.fertilization.good': 'Buena ventana para el muestreo de suelo',

    'log.history.title': 'Historial de la bitácora',
    'log.history.count': '{count} registros',
    'log.history.count.one': '1 registro',
    'log.history.cycle': 'Ciclo de la campaña',
    'log.history.always': 'Saneamiento RE-RE · siempre activo',
    'log.history.all': 'Todos los registros',
    'log.history.ago': 'hace {days} d',
    'log.history.delete.ask': '¿Borrar?',
    'log.history.delete.yes': 'Sí, borrar',
    'log.history.delete.hint': 'Borrar (si se registró por error)',
    'log.history.delete.label': 'Borrar {type} del {date}',
    'common.close': 'Cerrar',
    'common.error': 'Error',
  },
};

interface I18nProviderProps {
  children: ReactNode;
}

export const I18nProvider: React.FC<I18nProviderProps> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    // Get language from localStorage or default to 'en'
    const savedLanguage = localStorage.getItem('language') as Language;
    return savedLanguage || 'en';
  });

  useEffect(() => {
    // Save language to localStorage when it changes
    localStorage.setItem('language', language);
  }, [language]);

  /**
   * `t('sensors.lastSeen.days', { count: 286 })` → "hace 286 días".
   *
   * Values go through `{name}` placeholders, never through concatenation: `{count} + ' ' + t(…)`
   * freezes word order to one language and breaks in the next. `vars` is optional, so calls
   * without it work unchanged.
   */
  // `t` is passed as an effect dependency all over the app. Without memoising it changes identity
  // on every render, which turns any `useEffect(..., [t])` into an infinite request loop.
  const t = useCallback(
    (key: string, vars?: Record<string, string | number>): string => {
      const raw: string = (translations[language] as any)[key] || key;
      if (!vars) return raw;
      return raw.replace(/\{(\w+)\}/g, (match, name) =>
        vars[name] !== undefined ? String(vars[name]) : match
      );
    },
    [language]
  );

  // Same for the context object: unmemoized, each provider render gives a new value and re-renders
  // ALL its consumers, which is half the app.
  const value = useMemo(() => ({ language, setLanguage, t }), [language, t]);

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
};