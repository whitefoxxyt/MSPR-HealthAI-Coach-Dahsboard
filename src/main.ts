import { createApp } from 'vue'
import { createPinia } from 'pinia'

import App from './App.vue'
import router from './router'

// Font Awesome
import { library } from '@fortawesome/fontawesome-svg-core'
import { FontAwesomeIcon } from '@fortawesome/vue-fontawesome'
import {
  faBroom,
  faClipboardCheck,
  faRotate,
  faTriangleExclamation,
  faCircleCheck,
  faList,
  faSpinner,
  faCircleQuestion,
  faCopy,
  faChartLine,
  faFileCircleExclamation,
  faUser,
  faUtensils,
  faDumbbell,
  faHeartPulse,
  faCircleExclamation,
  faCircleInfo,
  faPen,
  faWandMagicSparkles,
  faTrash,
  faCheck,
  faXmark,
  faChevronLeft,
  faChevronRight,
  faClock,
  faCircleXmark,
  faDatabase,
  faThumbsUp,
  faThumbsDown,
  faCheckSquare,
  faInbox,
  faCode,
  faCalendarPlus,
  faCalendarCheck,
  faUserCheck,
  faEye,
  faFile,
} from '@fortawesome/free-solid-svg-icons'

// Ajouter les icônes à la bibliothèque
library.add(
  faBroom,
  faClipboardCheck,
  faRotate,
  faTriangleExclamation,
  faCircleCheck,
  faList,
  faSpinner,
  faCircleQuestion,
  faCopy,
  faChartLine,
  faFileCircleExclamation,
  faUser,
  faUtensils,
  faDumbbell,
  faHeartPulse,
  faCircleExclamation,
  faCircleInfo,
  faPen,
  faWandMagicSparkles,
  faTrash,
  faCheck,
  faXmark,
  faChevronLeft,
  faChevronRight,
  faClock,
  faCircleXmark,
  faDatabase,
  faThumbsUp,
  faThumbsDown,
  faCheckSquare,
  faInbox,
  faCode,
  faCalendarPlus,
  faCalendarCheck,
  faUserCheck,
  faEye,
  faFile,
)

const app = createApp(App)

app.component('FontAwesomeIcon', FontAwesomeIcon)
app.use(createPinia())
app.use(router)

app.mount('#app')
