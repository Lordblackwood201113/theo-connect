<!--
Copyright 2017 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <div>
    <nav class="navbar navbar-default">
      <div class="container-fluid">
        <div class="navbar-header">
          <button type="button" class="navbar-toggle collapsed"
            data-toggle="collapse" data-target=".navbar-collapse"
            aria-expanded="false">
            <span class="sr-only">{{ $t('action.toggle') }}</span>
            <span class="navbar-icon-bar"></span>
            <span class="navbar-icon-bar"></span>
            <span class="navbar-icon-bar"></span>
          </button>
          <router-link to="/" class="navbar-brand">
            <span class="brand-icon">T</span>
            <span class="brand-text">THEO COLLECT</span>
          </router-link>
        </div>
        <div class="collapse navbar-collapse">
          <navbar-links v-if="visiblyLoggedIn"/>
          <div class="navbar-right">
            <a v-show="showsAnalyticsNotice" id="navbar-analytics-notice"
              href="#" @click.prevent="analyticsIntroduction.show()">
              {{ $t('analyticsNotice') }}
            </a>
            <ul class="nav navbar-nav">
              <navbar-help-dropdown/>
              <navbar-locale-dropdown/>
              <navbar-actions/>
            </ul>
          </div>
        </div>
      </div>
    </nav>
    <analytics-introduction v-if="config.loaded && config.showsAnalytics"
      v-bind="analyticsIntroduction" @hide="analyticsIntroduction.hide()"/>
  </div>
</template>

<script>
import { defineAsyncComponent } from 'vue';

import NavbarActions from './navbar/actions.vue';
import NavbarHelpDropdown from './navbar/help-dropdown.vue';
import NavbarLinks from './navbar/links.vue';
import NavbarLocaleDropdown from './navbar/locale-dropdown.vue';

import useRoutes from '../composables/routes';
import { loadAsync } from '../util/load-async';
import { modalData } from '../util/reactivity';
import { useRequestData } from '../request-data';

export default {
  name: 'Navbar',
  components: {
    AnalyticsIntroduction: defineAsyncComponent(loadAsync('AnalyticsIntroduction')),
    NavbarActions,
    NavbarHelpDropdown,
    NavbarLinks,
    NavbarLocaleDropdown
  },
  inject: ['config', 'visiblyLoggedIn'],
  setup() {
    // The component does not assume that this data will exist when the
    // component is created.
    const { currentUser, analyticsConfig } = useRequestData();
    const { canRoute } = useRoutes();
    return { currentUser, analyticsConfig, canRoute };
  },
  data() {
    return {
      analyticsIntroduction: modalData('AnalyticsIntroduction')
    };
  },
  computed: {
    showsAnalyticsNotice() {
      return this.config.loaded && this.config.showsAnalytics && this.visiblyLoggedIn &&
        this.canRoute('/system/analytics') && this.analyticsConfig.dataExists &&
        this.analyticsConfig.isEmpty() &&
        Date.now() - Date.parse(this.currentUser.createdAt) >= /* 14 days */ 1209600000;
    }
  }
};
</script>

<style lang="scss">
@import '../assets/scss/variables';
@import '../assets/scss/mixins';

.navbar-default {
  background-color: white;
  border: none;
  border-bottom: 1px solid $color-geo-border;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.04);
  height: 56px;
  margin-bottom: 0;
  min-height: auto;
  transition: box-shadow 0.2s ease;

  .container-fluid {
    display: flex;
    align-items: center;
    height: 100%;
    max-width: 1400px;
    margin: 0 auto;
  }

  .navbar-header {
    display: flex;
    align-items: center;
    height: 100%;
  }

  .navbar-brand {
    display: flex;
    align-items: center;
    gap: 10px;
    font-size: 15px;
    font-weight: 700;
    height: auto;
    letter-spacing: -0.02em;
    line-height: 1;
    padding: 0 15px;
    text-decoration: none;
    transition: opacity 0.15s ease;

    &:hover {
      opacity: 0.8;
    }

    .brand-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 32px;
      height: 32px;
      background: linear-gradient(135deg, $color-geo-green 0%, $color-geo-green-dark 100%);
      border-radius: 8px;
      color: white;
      font-size: 18px;
      font-weight: 800;
    }

    .brand-text {
      color: $color-geo-dark;
    }

    &:focus {
      background-color: transparent;
      text-decoration: none;
      outline: none;
    }
  }

  .navbar-nav {
    font-size: 13px;
    display: flex;
    align-items: center;
    height: 100%;
    margin: 0;

    > li {
      height: 100%;
      display: flex;
      align-items: center;

      > a {
        color: $color-geo-gray;
        padding: 8px 14px;
        border-radius: 6px;
        transition: all 0.15s ease;
        display: flex;
        align-items: center;
        gap: 6px;

        &:hover {
          color: $color-geo-dark;
          background-color: $color-geo-bg;
        }

        &:focus {
          color: $color-geo-dark;
          background-color: $color-geo-bg;
          outline: none;
        }
      }
    }

    .active > a {
      color: $color-geo-green;
      background-color: rgba($color-geo-green, 0.08);

      &:hover, &:focus {
        color: $color-geo-green;
        background-color: rgba($color-geo-green, 0.12);
      }
    }

    .open > a {
      color: $color-geo-green;
      background-color: $color-geo-bg;

      &:hover, &:focus {
        color: $color-geo-green;
        background-color: $color-geo-bg;
      }
    }
  }

  .navbar-collapse {
    display: flex;
    align-items: center;
    flex: 1;
    height: 100%;
  }
}

#navbar-analytics-notice {
  @include text-link;
  background-color: $color-warning-light;
  border: 1px solid $color-warning;
  border-radius: 4px;
  float: left;
  font-size: 11px;
  font-weight: 500;
  margin-right: 16px;
  padding: 4px 8px;
  color: $color-warning-dark;
  transition: all 0.15s ease;

  &:hover, &:focus {
    background-color: $color-warning;
    color: white;
  }
}

// Navbar is not collapsed.
@media (min-width: 768px) {
  .navbar-default {
    border-radius: 0;

    .navbar-brand {
      margin-left: 0;
    }
  }

  .navbar-right {
    display: flex;
    align-items: center;
    margin-left: auto;
    margin-right: 0;
  }

  #navbar-actions {
    margin-left: 8px;
  }
}

// Navbar is collapsed.
@media (max-width: 767px) {
  .navbar-default {
    height: auto;
    min-height: 56px;
    padding: 8px 0;

    .container-fluid {
      flex-wrap: wrap;
    }

    .navbar-header {
      width: 100%;
      justify-content: space-between;
    }

    .navbar-toggle {
      border: none;
      padding: 8px;
      margin: 0;
      border-radius: 6px;
      background-color: transparent;
      transition: background-color 0.15s ease;

      &:hover, &:focus {
        background-color: $color-geo-bg;
      }

      .navbar-icon-bar {
        background-color: $color-geo-dark;
        width: 20px;
        height: 2px;
        border-radius: 1px;
        display: block;
        margin: 4px 0;
      }
    }

    .navbar-collapse {
      width: 100%;
      background-color: white;
      border-top: 1px solid $color-geo-border;
      margin-top: 8px;
      padding-top: 8px;
      flex-direction: column;
      align-items: stretch;
    }

    .navbar-nav {
      flex-direction: column;
      width: 100%;

      > li {
        width: 100%;

        > a {
          width: 100%;
          padding: 12px 16px;
          border-radius: 8px;
        }
      }

      .active > a {
        border-left: 3px solid $color-geo-green;
        border-radius: 0 8px 8px 0;
        padding-left: 13px;
      }

      .open .dropdown-menu {
        background-color: $color-geo-bg;
        border-radius: 8px;
        margin: 4px 0;
        padding: 8px;

        > li > a {
          color: $color-geo-gray;
          padding: 10px 12px;
          border-radius: 6px;

          &:hover, &:focus {
            color: $color-geo-dark;
            background-color: white;
          }
        }
      }
    }

    .navbar-right {
      width: 100%;
      flex-direction: column;
      margin: 0;
    }
  }

  #navbar-analytics-notice {
    display: none;
  }
}

// Dropdown menus styling
.navbar-default .dropdown-menu {
  background-color: white;
  border: 1px solid $color-geo-border;
  border-radius: 8px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  padding: 8px;
  margin-top: 4px;

  > li > a {
    color: $color-geo-gray;
    padding: 10px 14px;
    border-radius: 6px;
    transition: all 0.15s ease;

    &:hover, &:focus {
      color: $color-geo-dark;
      background-color: $color-geo-bg;
    }
  }

  .divider {
    background-color: $color-geo-border;
    margin: 8px 0;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    "action": {
      // Used by screen readers to describe the button used to show or hide the navigation bar on small screens ("hamburger menu").
      "toggle": "Toggle navigation"
    },
    "analyticsNotice": "Help improve Central!"
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "action": {
      "toggle": "Přepnout navigaci"
    },
    "analyticsNotice": "Pomozte zlepšit Central!"
  },
  "de": {
    "action": {
      "toggle": "Navigation umschalten"
    },
    "analyticsNotice": "Hilf Central zu verbessern!"
  },
  "es": {
    "action": {
      "toggle": "Alternar la navegación"
    },
    "analyticsNotice": "Ayuda a mejorar Central"
  },
  "fr": {
    "action": {
      "toggle": "Basculer la navigation"
    },
    "analyticsNotice": "Aidez à améliorer Central !"
  },
  "id": {
    "action": {
      "toggle": "Navigasi Toggle"
    },
    "analyticsNotice": "Bantu Memperbaiki Central!"
  },
  "it": {
    "action": {
      "toggle": "Attiva/disattiva navigazione"
    },
    "analyticsNotice": "Aiuta a migliorare Central"
  },
  "ja": {
    "action": {
      "toggle": "ナビゲーションを有効化"
    },
    "analyticsNotice": "Centralの改善を支援！"
  },
  "pt": {
    "action": {
      "toggle": "Ocultar ou exibir a barra de navegação"
    },
    "analyticsNotice": "Ajude a melhorar o Central!"
  },
  "sw": {
    "action": {
      "toggle": "Geuza urambazaji"
    },
    "analyticsNotice": "Saidia kuboresha Central"
  },
  "zh": {
    "action": {
      "toggle": "切换导航"
    },
    "analyticsNotice": "助力完善Central！"
  },
  "zh-Hant": {
    "action": {
      "toggle": "切換導航鈕"
    },
    "analyticsNotice": "幫忙改善 Central!"
  }
}
</i18n>
