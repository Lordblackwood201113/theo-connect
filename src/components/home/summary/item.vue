<!--
Copyright 2022 ODK Central Developers
See the NOTICE file at the top-level directory of this distribution and at
https://github.com/getodk/central-frontend/blob/master/NOTICE.

This file is part of ODK Central. It is subject to the license terms in
the LICENSE file found in the top-level directory of this distribution and at
https://www.apache.org/licenses/LICENSE-2.0. No part of ODK Central,
including this file, may be copied, modified, propagated, or distributed
except according to the terms contained in the LICENSE file.
-->
<template>
  <linkable tag="div" :to="to" class="home-summary-item">
    <div class="heading">
      <span :class="`icon-${icon}`"></span>
      <div>
        <div class="header">
          <slot name="header"></slot>
        </div>
        <div class="subheader">
          <slot name="subheader"></slot>
        </div>
      </div>
    </div>
    <p class="body"><slot name="body"></slot></p>
  </linkable>
</template>

<script>
import Linkable from '../../linkable.vue';

export default {
  name: 'HomeSummaryItem',
  components: { Linkable },
  props: {
    to: String,
    icon: {
      type: String,
      required: true
    }
  }
};
</script>

<style lang="scss">
@import '../../../assets/scss/mixins';
@import '../../../assets/scss/variables';

.home-summary-item {
  padding: 20px;
  background-color: white;
  border-radius: 12px;
  border: 1px solid $color-geo-border;
  flex: 1 1 0px;
  min-width: 200px;
  transition: all 0.2s ease;

  &:hover {
    border-color: $color-geo-green;
    box-shadow: 0 4px 12px rgba(45, 79, 66, 0.1);
    transform: translateY(-2px);
  }

  .heading {
    align-items: center;
    display: flex;
    gap: 14px;
    margin-bottom: 12px;

    > [class^="icon-"] {
      width: 44px;
      height: 44px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, $color-geo-green 0%, $color-geo-green-dark 100%);
      border-radius: 10px;
      color: white;
      font-size: 20px;
    }
  }

  .header {
    font-size: 28px;
    margin-bottom: 2px;
    line-height: 1;
    font-weight: 700;
    color: $color-geo-dark;
  }

  .subheader {
    font-size: 13px;
    color: $color-geo-gray;
    font-weight: 500;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .body {
    font-size: 13px;
    line-height: 1.5;
    margin-bottom: 0;
    color: $color-geo-gray;
  }
}
</style>
