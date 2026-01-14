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
  <div id="project-list">
    <page-section>
      <template #heading>
        <span>{{ $t('resource.projects') }}</span>
      </template>
      <template #body>
        <!-- Toolbar with search, sort, and create -->
        <div class="project-list-toolbar">
          <div class="search-container">
            <span class="icon-search"></span>
            <input
              v-model="searchQuery"
              type="text"
              class="search-input"
              :placeholder="$t('searchPlaceholder')"
            >
            <button v-if="searchQuery" class="search-clear" @click="searchQuery = ''">
              <span class="icon-close"></span>
            </button>
          </div>
          <div class="toolbar-actions">
            <project-sort v-model="sortMode"/>
            <button v-if="currentUser.can('project.create')"
              id="project-list-new-button" type="button" class="btn btn-primary"
              @click="createModal.show()">
              <span class="icon-plus-circle"></span>{{ $t('action.create') }}
            </button>
          </div>
        </div>

        <!-- Projects count -->
        <div v-if="projects.dataExists && filteredProjects.length > 0" class="projects-count">
          {{ $tcn('projectCount', filteredProjects.length) }}
          <span v-if="searchQuery" class="search-filter-info">
            ({{ $t('filtered') }})
          </span>
        </div>

        <!-- Project cards -->
        <div v-if="projects.dataExists" class="project-cards-container">
          <project-home-block v-for="project of displayedProjects" :key="project.id"
            :project="project" :sort-func="sortFunction"
            :max-forms="maxForms" :max-datasets="maxDatasets"/>
        </div>

        <!-- No results message -->
        <div v-if="projects.dataExists && filteredProjects.length === 0 && searchQuery" class="no-results">
          <span class="icon-search"></span>
          <p>{{ $t('noResults', { query: searchQuery }) }}</p>
          <button class="btn btn-link" @click="searchQuery = ''">{{ $t('clearSearch') }}</button>
        </div>

        <loading :state="projects.initiallyLoading"/>
        <p v-if="projects.dataExists && activeProjects.length === 0 && !searchQuery"
          class="empty-table-message">
          <template v-if="currentUser.can('project.create')">
            {{ $t('emptyTable.canCreate') }}<sentence-separator/>
            <i18n-t keypath="moreInfo.clickHere.full">
              <template #clickHere>
                <doc-link to="central-projects/">{{ $t('moreInfo.clickHere.clickHere') }}</doc-link>
              </template>
            </i18n-t>
          </template>
          <template v-else>{{ $t('emptyTable.cannotCreate') }}</template>
        </p>
      </template>
    </page-section>
    <page-section v-if="archivedProjects.length > 0">
      <template #heading>
        <span>{{ $t('archived') }}</span>
      </template>
      <template #body>
        <div id="project-list-archived">
          <div v-for="project of archivedProjects" :key="project.id">
            <div class="project-title">
              <router-link :to="projectPath(project.id)">{{ project.name }}</router-link>
            </div>
          </div>
        </div>
      </template>
    </page-section>
    <project-new v-bind="createModal" @hide="createModal.hide()"
      @success="afterCreate"/>
  </div>
</template>

<script>
import { computed, ref, watchEffect } from 'vue';
import { sum } from 'ramda';

import DocLink from '../doc-link.vue';
import Loading from '../loading.vue';
import PageSection from '../page/section.vue';
import ProjectNew from './new.vue';
import ProjectHomeBlock from './home-block.vue';
import ProjectSort from './sort.vue';
import SentenceSeparator from '../sentence-separator.vue';

import sortFunctions from '../../util/sort';
import useChunkyArray from '../../composables/chunky-array';
import useRoutes from '../../composables/routes';
import { modalData } from '../../util/reactivity';
import { sumUnderThreshold } from '../../util/util';
import { useRequestData } from '../../request-data';

export default {
  name: 'ProjectList',
  components: {
    DocLink,
    Loading,
    PageSection,
    ProjectNew,
    ProjectHomeBlock,
    ProjectSort,
    SentenceSeparator
  },
  inject: ['alert'],
  setup() {
    const { currentUser, projects } = useRequestData();

    // Search query
    const searchQuery = ref('');

    const sortMode = computed({
      get() {
        // currentUser.preferences goes missing on logout, see https://github.com/getodk/central-frontend/pull/1024#pullrequestreview-2332522640
        return currentUser.preferences?.site?.projectSortMode;
      },
      set(val) {
        currentUser.preferences.site.projectSortMode = val;
      },
    });

    const sortFunction = computed(() => sortFunctions[sortMode.value]);

    const activeProjects = ref(null);
    watchEffect(() => {
      activeProjects.value = projects.dataExists
        ? projects.filter((p) => !(p.archived))
        : [];
    });
    watchEffect(() => { activeProjects.value.sort(sortFunction.value); });

    // Filtered projects based on search query
    const filteredProjects = computed(() => {
      if (!activeProjects.value) return [];
      if (!searchQuery.value.trim()) return activeProjects.value;

      const query = searchQuery.value.toLowerCase().trim();
      return activeProjects.value.filter(project => {
        // Search in project name
        if (project.name.toLowerCase().includes(query)) return true;
        // Search in form names
        if (project.formList?.some(form => form.name?.toLowerCase().includes(query))) return true;
        // Search in dataset names
        if (project.datasetList?.some(ds => ds.name?.toLowerCase().includes(query))) return true;
        return false;
      });
    });

    const displayedProjects = useChunkyArray(filteredProjects);

    const { projectPath } = useRoutes();
    return {
      currentUser, projects,
      searchQuery,
      sortMode, sortFunction,
      activeProjects, filteredProjects, displayedProjects,
      createModal: modalData(),
      projectPath
    };
  },
  computed: {
    archivedProjects() {
      if (!this.projects.dataExists) return [];
      const filteredProjects = this.projects.filter((p) => (p.archived));
      return filteredProjects.sort(this.sortFunction);
    },
    // Requirement:
    // - Show atleast 3 items (forms/datasets) per project (if there are)
    // - if showing only 3 items per project doesn't show 15 items in total across all projects
    //   then show more items until total items shown is close to 15
    // - Don't show closed forms
    maxForms() {
      let limit = 2;
      let formsShown;

      const formCounts = this.projects.map((project) =>
        project.formList.filter((f) => f.state !== 'closed').length);
      const totalForms = sum(formCounts);

      do {
        limit += 1;
        formsShown = sumUnderThreshold(formCounts, limit); // formCounts.reduce((acc, i) => acc + Math.min(i, limit), 0);
      }
      while (formsShown < 15 && formsShown < totalForms);

      return formsShown > 15 && limit > 3 ? limit - 1 : limit;
    },
    maxDatasets() {
      let limit = 2;
      let dsShown;

      const datasetCounts = this.projects.map(p => p.datasetList.length);
      const totalDatasets = sum(datasetCounts);

      do {
        limit += 1;
        dsShown = sumUnderThreshold(datasetCounts, limit); // datasetCounts.reduce((acc, i) => acc + Math.min(i, limit), 0);
      }
      while (dsShown < 15 && dsShown < totalDatasets);

      return dsShown > 15 && limit > 3 ? limit - 1 : limit;
    }
  },
  methods: {
    afterCreate(project) {
      const message = this.$t('alert.create');
      this.$router.push(this.projectPath(project.id))
        .then(() => { this.alert.success(message); });
    },
  }
};
</script>

<style lang="scss">
@import '../../assets/scss/variables';

#project-list {
  // Toolbar
  .project-list-toolbar {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    margin-bottom: 20px;
    flex-wrap: wrap;

    @media (max-width: 600px) {
      flex-direction: column;
      align-items: stretch;
    }
  }

  // Search container
  .search-container {
    position: relative;
    flex: 1;
    max-width: 400px;
    min-width: 200px;

    @media (max-width: 600px) {
      max-width: 100%;
    }

    .icon-search {
      position: absolute;
      left: 14px;
      top: 50%;
      transform: translateY(-50%);
      color: $color-geo-gray;
      font-size: 14px;
    }

    .search-input {
      width: 100%;
      padding: 12px 40px 12px 42px;
      border: 1px solid $color-geo-border;
      border-radius: 10px;
      font-size: 14px;
      background: white;
      transition: all 0.2s ease;

      &:focus {
        outline: none;
        border-color: $color-geo-green;
        box-shadow: 0 0 0 3px rgba(45, 79, 66, 0.1);
      }

      &::placeholder {
        color: $color-geo-gray;
      }
    }

    .search-clear {
      position: absolute;
      right: 8px;
      top: 50%;
      transform: translateY(-50%);
      background: $color-geo-bg;
      border: none;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.15s ease;

      .icon-close {
        font-size: 10px;
        color: $color-geo-gray;
      }

      &:hover {
        background: $color-geo-border;
      }
    }
  }

  // Toolbar actions
  .toolbar-actions {
    display: flex;
    align-items: center;
    gap: 12px;

    @media (max-width: 600px) {
      justify-content: space-between;
    }
  }

  #project-list-new-button {
    border-radius: 8px;
    padding: 10px 18px;
    font-weight: 500;
    transition: all 0.2s ease;

    .icon-plus-circle {
      margin-right: 6px;
    }

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(45, 79, 66, 0.3);
    }
  }

  // Projects count
  .projects-count {
    font-size: 13px;
    color: $color-geo-gray;
    margin-bottom: 16px;
    font-weight: 500;

    .search-filter-info {
      color: $color-geo-green;
    }
  }

  // Project cards container
  .project-cards-container {
    display: flex;
    flex-direction: column;
    gap: 0;
  }

  // No results
  .no-results {
    text-align: center;
    padding: 60px 24px;
    background: $color-geo-card;
    border-radius: 12px;
    border: 1px dashed $color-geo-border;

    .icon-search {
      font-size: 48px;
      color: $color-geo-border;
      margin-bottom: 16px;
      display: block;
    }

    p {
      color: $color-geo-gray;
      font-size: 15px;
      margin-bottom: 12px;
    }

    .btn-link {
      color: $color-geo-green;
      font-weight: 500;
    }
  }

  .empty-table-message {
    text-align: center;
    padding: 48px 24px;
    background: $color-geo-card;
    border-radius: 12px;
    border: 1px dashed $color-geo-border;
    color: $color-geo-gray;
    font-size: 15px;
    line-height: 1.6;
  }
}

#project-list-archived {
  margin-top: 32px;

  > div {
    display: grid;
    gap: 8px;
  }

  .project-title {
    font-size: 16px;
    font-weight: 500;
    padding: 12px 16px;
    background: $color-geo-card;
    border-radius: 8px;
    border: 1px solid $color-geo-border;
    transition: all 0.15s ease;

    &:hover {
      background: $color-geo-bg;
      transform: translateX(4px);
    }

    a {
      color: $color-geo-gray;
      text-decoration: none;

      &:hover {
        color: $color-geo-green;
      }
    }
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    // This header is shown above a section of a page, specificially a list of names of archived projects.
    "archived": "Archived Projects",
    "action": {
      // This is the text of a button that is used to create a new Project.
      "create": "New"
    },
    "emptyTable": {
      "canCreate": "To get started, create a Project. Projects help you organize your data by grouping related Forms and Users.",
      "cannotCreate": "There are no Projects to show. If you expect to see Projects here, talk to the person who gave you this account. They may need to assign a Project Role for Projects you're supposed to see."
    },
    "alert": {
      "create": "Your new Project has been successfully created."
    },
    // Search functionality
    "searchPlaceholder": "Search projects...",
    "projectCount": "{count} Project | {count} Projects",
    "filtered": "filtered",
    "noResults": "No projects found for \"{query}\"",
    "clearSearch": "Clear search"
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "archived": "Archivované projekty",
    "action": {
      "create": "Nový"
    },
    "emptyTable": {
      "canCreate": "Chcete-li začít, vytvořte projekt. Projekty vám pomohou uspořádat data seskupením souvisejících formulářů a uživatelů.",
      "cannotCreate": "Neexistují žádné projekty, které by bylo možné zobrazit. Pokud očekáváte, že se zde Projekty zobrazí, obraťte se na osobu, která vám tento účet poskytla. Možná bude potřebovat přiřadit Projektovou roli pro Projekty, které byste měli vidět."
    },
    "alert": {
      "create": "Váš nový projekt byl úspěšně vytvořen."
    }
  },
  "de": {
    "archived": "Archivierte Projekte",
    "action": {
      "create": "Neu"
    },
    "emptyTable": {
      "canCreate": "Erstellen Sie zunächst ein Projekt. Projekte helfen Ihnen, Ihre Daten zu organisieren, indem Sie verwandte Formulare und Benutzer gruppieren.",
      "cannotCreate": "Es gibt keine anzuzeigenden Projekte. Wenn Sie erwarten, dass Projekte hier angezeigt werden, sprechen Sie mit der Person, die Ihnen dieses Konto gegeben hat. Sie müssen möglicherweise eine Projektrolle für Projekte zuweisen, die Sie sehen sollen."
    },
    "alert": {
      "create": "Ihr neues Projekt wurde erfolgreich erstellt."
    }
  },
  "es": {
    "archived": "Proyectos archivados",
    "action": {
      "create": "Nuevo"
    },
    "emptyTable": {
      "canCreate": "Para comenzar, cree un Proyecto. Los proyectos lo ayudan a organizar sus datos agrupando formularios y usuarios relacionados.",
      "cannotCreate": "No hay Proyectos para mostrar. Si espera ver Proyectos aquí, hable con la persona que le dio esta cuenta. Es posible que deban asignar un rol de proyecto para los proyectos que se supone que debe ver."
    },
    "alert": {
      "create": "Su proyecto ha sido creado exitosamente"
    }
  },
  "fr": {
    "archived": "Projets archivés",
    "action": {
      "create": "Nouveau"
    },
    "emptyTable": {
      "canCreate": "Pour démarrer, créez un Projet. Les projets vous aident à organiser vos données en regroupant des formulaires et des utilisateurs qui sont liés",
      "cannotCreate": "Il n'y a pas de Projet à afficher. Si vous vous attendiez à en voir ici, contactez la personne qui vous a créé ce compte. Il pourrait devoir vous attribuer un rôle de projet pour les projets que vous êtes censé voir."
    },
    "alert": {
      "create": "Votre nouveau projet a été créé avec succès."
    },
    "searchPlaceholder": "Rechercher des projets...",
    "projectCount": "{count} Projet | {count} Projets",
    "filtered": "filtré",
    "noResults": "Aucun projet trouvé pour \"{query}\"",
    "clearSearch": "Effacer la recherche"
  },
  "id": {
    "archived": "Proyek Terarsip",
    "action": {
      "create": "Baru"
    },
    "alert": {
      "create": "Proyek baru Anda telah sukses dibuat."
    }
  },
  "it": {
    "archived": "Progetti archiviati",
    "action": {
      "create": "Nuovo"
    },
    "emptyTable": {
      "canCreate": "Per iniziare, crea un progetto. I progetti ti aiutano a organizzare i tuoi dati raggruppando i formulari e gli utenti correlati.",
      "cannotCreate": "Non ci sono progetti da mostrare. Se prevedi di vedere Progetti qui, parla con la persona che ti ha fornito questo account. Potrebbe essere necessario assegnare un ruolo di progetto per i progetti che dovresti vedere."
    },
    "alert": {
      "create": "Il tuo nuovo progetto è stato creato con successo."
    }
  },
  "ja": {
    "action": {
      "create": "新規作成"
    },
    "alert": {
      "create": "新規プロジェクトは正しく作成されました。"
    }
  },
  "pt": {
    "archived": "Projetos arquivados",
    "action": {
      "create": "Novo"
    },
    "emptyTable": {
      "canCreate": "Para começar, crie um Projeto. Os Projetos ajudam você a organizar seus dados agrupando Formulários e Usuários relacionados.",
      "cannotCreate": "Não há Projetos para mostrar. Se você espera ver Projetos aqui, fale com a pessoa que lhe deu esta conta. Ela pode precisar atribuir uma Função de Projeto nos Projetos que você deve ver."
    },
    "alert": {
      "create": "O seu novo projeto foi criado com sucesso."
    }
  },
  "sw": {
    "archived": "Miradi Iliyohifadhiwa",
    "action": {
      "create": "Mpya"
    },
    "emptyTable": {
      "canCreate": "Ili kuanza, tengeneza Mradi. Miradi hukusaidia kupanga data yako kwa kupanga Fomu na Watumiaji husika.",
      "cannotCreate": "Hakuna Miradi ya kuonyesha. Ikiwa unatarajia kuona Miradi hapa, zungumza na mtu aliyekupa akaunti hii. Huenda wakahitaji kupeana Jukumu la Mradi kwa Miradi unayopaswa kuona."
    },
    "alert": {
      "create": "Mradi wako mpya umeundwa."
    }
  },
  "zh": {
    "archived": "已存档的项目",
    "action": {
      "create": "更新"
    },
    "emptyTable": {
      "canCreate": "请先创建一个项目。项目可以帮助您通过将表单分组，和通过用户来管理数据。",
      "cannotCreate": "暂无项目可显示。如果您本应再次拥有项目，请联系为您创建此账户的负责人。对方可能需要为您分配相应的项目角色权限。"
    },
    "alert": {
      "create": "您的新项目以成功建立。"
    }
  },
  "zh-Hant": {
    "archived": "已歸檔專案",
    "action": {
      "create": "新訊息"
    },
    "emptyTable": {
      "canCreate": "首先，創建一個專案。專案可透過對相關表單和使用者分組來幫助您組織資料。",
      "cannotCreate": "沒有可顯示的專案。如果您希望在此處看到專案，請與向您提供此帳戶的人員聯絡。他們可能需要為您應該看到的專案分配專案角色。"
    },
    "alert": {
      "create": "您的新專案已成功建立。"
    }
  }
}
</i18n>
