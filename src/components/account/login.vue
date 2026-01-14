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
  <div id="account-login">
    <div class="login-container">
      <!-- Logo et Branding -->
      <div class="login-header">
        <div class="login-logo">
          <span class="logo-icon">T</span>
        </div>
        <h1 class="login-title">THEO COLLECT</h1>
        <p class="login-subtitle">{{ $t('subtitle') }}</p>
      </div>

      <!-- Carte de connexion -->
      <div class="login-card">
        <!-- OIDC Login -->
        <div v-if="config.oidcEnabled" class="login-content">
          <p class="oidc-message">{{ $t('oidc.body') }}</p>
          <a :href="oidcLoginPath" class="login-btn login-btn-primary"
            :class="{ disabled }" @click="loginByOIDC">
            {{ $t('action.continue') }}
            <spinner :state="disabled"/>
          </a>
        </div>

        <!-- Standard Login Form -->
        <div v-else class="login-content">
          <form @submit.prevent="submit">
            <div class="form-field">
              <input
                ref="email"
                v-model.trim="email"
                type="email"
                class="login-input"
                :placeholder="$t('field.email')"
                required
                autocomplete="off"
                @focus="emailFocused = true"
                @blur="emailFocused = email.length > 0"
              >
              <label class="login-label" :class="{ active: emailFocused || email }">
                {{ $t('field.email') }}
              </label>
              <span class="input-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
              </span>
            </div>

            <div class="form-field">
              <input
                v-model="password"
                :type="showPassword ? 'text' : 'password'"
                class="login-input"
                :placeholder="$t('field.password')"
                required
                autocomplete="current-password"
                @focus="passwordFocused = true"
                @blur="passwordFocused = password.length > 0"
              >
              <label class="login-label" :class="{ active: passwordFocused || password }">
                {{ $t('field.password') }}
              </label>
              <button type="button" class="password-toggle" @click="showPassword = !showPassword">
                <svg v-if="!showPassword" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                  <circle cx="12" cy="12" r="3"/>
                </svg>
                <svg v-else xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                  <line x1="1" y1="1" x2="23" y2="23"/>
                </svg>
              </button>
            </div>

            <div v-if="showMailingListOptIn" class="mailing-opt-in">
              <label class="checkbox-container">
                <input v-model="mailingListOptIn" type="checkbox">
                <span class="checkmark"></span>
                {{ $t('analytics.mailingListOptIn') }}
              </label>
            </div>

            <button type="submit" class="login-btn login-btn-primary" :disabled="disabled">
              <span v-if="!disabled">{{ $t('action.logIn') }}</span>
              <spinner v-else :state="disabled"/>
            </button>

            <router-link to="/reset-password" class="forgot-password">
              {{ $t('action.resetPassword') }}
            </router-link>
          </form>
        </div>
      </div>

      <!-- Footer -->
      <p class="login-footer">
        {{ $t('footer') }}
      </p>
    </div>
  </div>
</template>

<script>
import Spinner from '../spinner.vue';

import { enketoBasePath, noop } from '../../util/util';
import { localStore } from '../../util/storage';
import { logIn } from '../../util/session';
import { queryString } from '../../util/request';
import { useRequestData } from '../../request-data';

export default {
  name: 'AccountLogin',
  components: { Spinner },
  inject: ['container', 'alert', 'config', 'location'],
  beforeRouteLeave() {
    return !this.disabled;
  },
  setup() {
    const { currentUser, session } = useRequestData();
    return { currentUser, session };
  },
  data() {
    return {
      disabled: false,
      email: '',
      password: '',
      mailingListOptIn: true,
      showPassword: false,
      emailFocused: false,
      passwordFocused: false,
    };
  },
  computed: {
    oidcLoginPath() {
      const { query } = this.$route;
      const next = typeof query.next === 'string' ? query.next : null;
      const qs = queryString({ next });
      return `/v1/oidc/login${qs}`;
    },
    showMailingListOptIn() {
      return this.$route.query.source === 'claim';
    }
  },
  created() {
    this.handleOIDCError();
  },
  mounted() {
    if (this.config.oidcEnabled)
      window.addEventListener('pageshow', this.reenableIfPersisted);
    else if (this.$refs.email)
      this.$refs.email.focus();
  },
  beforeUnmount() {
    if (this.config.oidcEnabled)
      window.removeEventListener('pageshow', this.reenableIfPersisted);
  },
  methods: {
    verifyNewSession() {
      const sessionExpires = localStore.getItem('sessionExpires');
      const newSession = sessionExpires == null ||
        Number.parseInt(sessionExpires, 10) < Date.now();
      if (!newSession) {
        this.alert.info(this.$t('alert.alreadyLoggedIn'))
          .cta(this.$t('action.refresh'), () => { this.location.reload(); });
      }
      return newSession;
    },
    loginByOIDC(event) {
      if (!this.verifyNewSession()) {
        event.preventDefault();
        return;
      }

      this.disabled = true;
    },
    async handleOIDCError() {
      if (!this.config.oidcEnabled) return;

      const { oidcError, ...queryWithoutError } = this.$route.query;
      if (oidcError === undefined) return;
      // Remove the query parameter so that if the user refreshes the page, the
      // alert that we are about to show is not shown again.
      await this.$router.replace({ path: '/login', query: queryWithoutError });

      if (typeof oidcError === 'string' && /^[\w-]+$/.test(oidcError)) {
        const path = `oidc.error.${oidcError}`;
        if (this.$te(path, this.$i18n.fallbackLocale))
          this.alert.danger(this.$t(path));
      }
    },
    /* Pressing the back button on the IdP login page may restore Frontend from
    the back/forward cache. In that case, this.disabled would still be `true` --
    a confusing state for the user to return to. Instead, if the user comes back
    from the IdP, we set this.disabled to `false`, re-enabling the component.
    This method may be called in other cases as well, for example, if the user
    presses back on the Frontend login page, then presses forward to return to
    Frontend. It should be OK to set this.disabled to `false` in any such case:
    there's no real issue if the link ends up getting clicked multiple times. */
    reenableIfPersisted(event) {
      if (event.persisted) this.disabled = false;
    },
    navigateToNext(
      next,
      // Function that redirects within Frontend
      internal,
      // Function that redirects outside Frontend
      external
    ) {
      if (typeof next !== 'string') return internal('/');
      let url;
      try {
        url = new URL(next, window.location.origin);
      } catch (e) {
        return internal('/');
      }
      if (url.origin !== window.location.origin || url.pathname === '/login')
        return internal('/');

      if (url.pathname.startsWith(`${enketoBasePath}/`))
        return external(url.href);
      return internal(url.pathname + url.search + url.hash);
    },
    submit() {
      if (!this.verifyNewSession()) return;
      this.disabled = true;
      this.session.request({
        method: 'POST',
        url: '/v1/sessions',
        data: { email: this.email, password: this.password },
        problemToAlert: ({ code }) =>
          (code === 401.2 ? this.$t('problem.401_2') : null)
      })
        .then(() => logIn(this.container, true))
        .then(() => {
          if (this.showMailingListOptIn) {
            this.currentUser.preferences.site.mailingListOptIn = this.mailingListOptIn;
          }
          this.navigateToNext(
            this.$route.query.next,
            (location) => {
              // We only set this.disabled to `false` before redirecting within
              // Frontend. If we also set this.disabled before redirecting
              // outside Frontend, the buttons might be re-enabled before the
              // external page is loaded.
              this.disabled = false;
              const message = this.$t('alert.changePassword');
              this.$router.replace(location)
                .catch(noop)
                .then(() => {
                  if (this.password.length < 10) this.alert.info(message);
                });
            },
            (url) => {
              window.location.replace(url);
            }
          );
        })
        .catch(() => {
          this.disabled = false;
        });
    }
  }
};
</script>

<style lang="scss" scoped>
@import '../../assets/scss/variables';

#account-login {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, $color-geo-bg 0%, darken($color-geo-bg, 3%) 100%);
  padding: 20px;
}

.login-container {
  width: 100%;
  max-width: 420px;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.login-header {
  text-align: center;
  margin-bottom: 32px;
}

.login-logo {
  margin-bottom: 16px;
}

.logo-icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, $color-geo-green 0%, $color-geo-green-dark 100%);
  border-radius: 16px;
  color: white;
  font-size: 32px;
  font-weight: 800;
  box-shadow: 0 8px 24px rgba($color-geo-green, 0.3);
}

.login-title {
  font-size: 24px;
  font-weight: 700;
  color: $color-geo-dark;
  margin: 0 0 8px 0;
  letter-spacing: -0.02em;
}

.login-subtitle {
  font-size: 14px;
  color: $color-geo-gray;
  margin: 0;
}

.login-card {
  width: 100%;
  background: white;
  border-radius: 16px;
  box-shadow: 0 4px 24px rgba(0, 0, 0, 0.08);
  overflow: hidden;
}

.login-content {
  padding: 32px;
}

.form-field {
  position: relative;
  margin-bottom: 20px;
}

.login-input {
  width: 100%;
  padding: 16px 48px 16px 16px;
  font-size: 15px;
  border: 2px solid $color-geo-border;
  border-radius: 12px;
  background: white;
  color: $color-geo-dark;
  transition: all 0.2s ease;
  outline: none;

  &::placeholder {
    color: transparent;
  }

  &:focus {
    border-color: $color-geo-green;
    box-shadow: 0 0 0 4px rgba($color-geo-green, 0.1);
  }

  &:focus + .login-label,
  &:not(:placeholder-shown) + .login-label {
    transform: translateY(-28px) scale(0.85);
    color: $color-geo-green;
    background: white;
    padding: 0 6px;
  }
}

.login-label {
  position: absolute;
  left: 14px;
  top: 16px;
  font-size: 15px;
  color: $color-geo-gray;
  pointer-events: none;
  transition: all 0.2s ease;
  transform-origin: left;

  &.active {
    transform: translateY(-28px) scale(0.85);
    color: $color-geo-green;
    background: white;
    padding: 0 6px;
  }
}

.input-icon {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  color: $color-geo-gray;
  pointer-events: none;
}

.password-toggle {
  position: absolute;
  right: 16px;
  top: 50%;
  transform: translateY(-50%);
  background: none;
  border: none;
  color: $color-geo-gray;
  cursor: pointer;
  padding: 4px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: color 0.2s ease;

  &:hover {
    color: $color-geo-green;
  }
}

.mailing-opt-in {
  margin-bottom: 24px;
}

.checkbox-container {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 14px;
  color: $color-geo-gray;
  cursor: pointer;

  input[type="checkbox"] {
    width: 18px;
    height: 18px;
    accent-color: $color-geo-green;
  }
}

.login-btn {
  width: 100%;
  padding: 16px 24px;
  font-size: 15px;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  text-decoration: none;

  &.login-btn-primary {
    background: linear-gradient(135deg, $color-geo-green 0%, $color-geo-green-dark 100%);
    color: white;
    box-shadow: 0 4px 12px rgba($color-geo-green, 0.3);

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba($color-geo-green, 0.4);
    }

    &:active:not(:disabled) {
      transform: translateY(0);
    }

    &:disabled {
      opacity: 0.7;
      cursor: not-allowed;
    }
  }

  &.disabled {
    opacity: 0.7;
    pointer-events: none;
  }
}

.forgot-password {
  display: block;
  text-align: center;
  margin-top: 20px;
  font-size: 14px;
  color: $color-geo-gray;
  text-decoration: none;
  transition: color 0.2s ease;

  &:hover {
    color: $color-geo-green;
  }
}

.oidc-message {
  text-align: center;
  color: $color-geo-gray;
  margin-bottom: 24px;
  font-size: 14px;
}

.login-footer {
  margin-top: 24px;
  font-size: 12px;
  color: $color-geo-gray;
  text-align: center;
}

// Responsive adjustments
@media (max-width: 480px) {
  .login-content {
    padding: 24px;
  }

  .logo-icon {
    width: 56px;
    height: 56px;
    font-size: 28px;
  }

  .login-title {
    font-size: 20px;
  }
}
</style>

<i18n lang="json5">
{
  "en": {
    "subtitle": "Geo-referenced agricultural data collection",
    "footer": "Powered by THEO COLLECT",
    "alert": {
      "alreadyLoggedIn": "A user is already logged in. Please refresh the page to continue.",
      "changePassword": "To protect your account, make sure your password is 10 characters or longer."
    },
    "oidc": {
      "body": "Click Continue to proceed to the login page.",
      "error": {
        "auth-ok-user-not-found": "There is no Central account associated with your email address. Please ask your Central administrator to create an account for you to continue.",
        "email-not-verified": "Your email address has not been verified by your login server. Please contact your server administrator.",
        "email-claim-not-provided": "Central could not access the email address associated with your account. This could be because your server administrator has configured something incorrectly, or has not set an email address for your account. It could also be the result of privacy options that you can choose during the login process. If so, please try again and ensure that your email is shared.",
        "internal-server-error": "Something went wrong during login. Please contact your server administrator."
      }
    },
    "problem": {
      "401_2": "Incorrect email address and/or password."
    }
  }
}
</i18n>

<!-- Autogenerated by destructure.js -->
<i18n>
{
  "cs": {
    "alert": {
      "alreadyLoggedIn": "Uživatel je již přihlášen. Chcete-li pokračovat, obnovte stránku."
    },
    "oidc": {
      "body": "Kliknutím na tlačítko Pokračovat přejdete na přihlašovací stránku.",
      "error": {
        "auth-ok-user-not-found": "K vaší e-mailové adrese není přiřazen žádný centrální účet. Požádejte prosím správce Central, aby vám vytvořil účet, abyste mohli pokračovat.",
        "email-not-verified": "Vaše e-mailová adresa nebyla ověřena přihlašovacím serverem. Obraťte se prosím na správce serveru.",
        "email-claim-not-provided": "Central nemohl získat přístup k e-mailové adrese přidružené k vašemu účtu. Může to být způsobeno tím, že správce serveru něco špatně nakonfiguroval nebo že e-mailovou adresu pro váš účet nenastavil. Může to být také důsledek možností ochrany osobních údajů, které můžete zvolit během přihlašovacího procesu. V takovém případě to zkuste znovu a ujistěte se, že je váš e-mail sdílený.",
        "internal-server-error": "Při přihlašování se něco pokazilo. Kontaktujte prosím správce serveru."
      }
    },
    "problem": {
      "401_2": "Nesprávná e-mailová adresa nebo heslo."
    }
  },
  "de": {
    "alert": {
      "alreadyLoggedIn": "Ein Benutzer ist bereits eingeloggt. Bitte die Seite aktualisieren um weiterzuarbeiten.",
      "changePassword": "Um Ihr Konto zu schützen, achten Sie darauf, dass Ihr Passwort mindestens 10 Zeichen lang ist."
    },
    "oidc": {
      "body": "Klicken Sie auf Weiter, um zur Anmeldeseite zu gelangen.",
      "error": {
        "auth-ok-user-not-found": "Mit Ihrer E-Mail-Adresse ist kein Central-Konto verknüpft. Bitten Sie Ihren zentralen Administrator, ein Konto zu erstellen, damit Sie fortfahren können.",
        "email-not-verified": "Ihre E-Mail-Adresse wurde von Ihrem Anmeldeserver nicht überprüft. Bitte wenden Sie sich an Ihren Serveradministrator.",
        "email-claim-not-provided": "Central konnte nicht auf die mit Ihrem Konto verknüpfte E-Mail-Adresse zugreifen. Dies kann daran liegen, dass Ihr Serveradministrator etwas falsch konfiguriert hat oder keine E-Mail-Adresse für Ihr Konto festgelegt hat. Dies könnte auch auf Datenschutzoptionen zurückzuführen sein, die Sie während des Anmeldevorgangs auswählen können. Wenn ja, versuchen Sie es bitte erneut und stellen Sie sicher, dass Ihre E-Mail-Adresse geteilt wird.",
        "internal-server-error": "Beim Anmelden ist ein Fehler aufgetreten. Bitte wenden Sie sich an Ihren Serveradministrator."
      }
    },
    "problem": {
      "401_2": "Falsche E-Mail-Adresse und/oder Passwort."
    }
  },
  "es": {
    "alert": {
      "alreadyLoggedIn": "Un usuario ya ha iniciado sesión. Actualice la página para continuar.",
      "changePassword": "Para proteger tu cuenta, asegúrate de que tu contraseña tiene 10 caracteres o más."
    },
    "oidc": {
      "body": "Haga clic en Continuar para pasar a la página de inicio de sesión.",
      "error": {
        "auth-ok-user-not-found": "No hay ninguna cuenta Central asociada con su dirección de correo electrónico. Pídale a su administrador central que cree una cuenta para continuar.",
        "email-not-verified": "Su dirección de correo electrónico no ha sido verificada por su servidor de inicio de sesión. Comuníquese con el administrador de su servidor.",
        "email-claim-not-provided": "Central no pudo acceder a la dirección de correo electrónico asociada con su cuenta. Esto podría deberse a que el administrador de su servidor haya configurado algo incorrectamente o no haya configurado una dirección de correo electrónico para su cuenta. También podría ser el resultado de las opciones de privacidad que puedes elegir durante el proceso de inicio de sesión. Si es así, inténtalo de nuevo y asegúrate de que tu correo electrónico esté compartido.",
        "internal-server-error": "Algo salió mal durante el inicio de sesión. Comuníquese con el administrador de su servidor."
      }
    },
    "problem": {
      "401_2": "Dirección de correo electrónico y/o contraseña incorrecta."
    }
  },
  "fr": {
    "subtitle": "Collecte de donnees agricoles geo-referencees",
    "footer": "Propulse par THEO COLLECT",
    "alert": {
      "alreadyLoggedIn": "Un utilisateur est deja connecte. Merci de rafraichir la page pour continuer.",
      "changePassword": "Pour proteger votre compte, assurez vous de choisir un mot de passe d'au moins 10 caracteres."
    },
    "oidc": {
      "body": "Cliquez sur Continuer pour accéder à la page de connexion.",
      "error": {
        "auth-ok-user-not-found": "Il n'y a pas de compte Central associé à votre adresse de courriel. Veuillez demander à votre administrateur de Central de vous créer un compte pour continuer.",
        "email-not-verified": "Votre adresse de courriel n'a pas été vérifiée par votre serveur de connexion. Veuillez contacter l'administrateur de votre serveur.",
        "email-claim-not-provided": "Central n'a pas pu accéder à l'adresse de courriel associée à votre compte. Cela peut être dû au fait que l'administrateur de votre serveur a configuré quelque chose de manière incorrecte ou n'a pas défini d'adresse de courriel pour votre compte. Cela peut également être dû aux options de confidentialité que vous pouvez choisir durant la procédure de connexion. Si c'est le cas, veuillez réessayer et vous assurer que votre adresse de courriel est partagée.",
        "internal-server-error": "Un problème s'est produit lors de la connexion. Veuillez contacter l'administrateur de votre serveur."
      }
    },
    "problem": {
      "401_2": "Adresse de courriel et/ou mot de passe invalides."
    }
  },
  "id": {
    "alert": {
      "alreadyLoggedIn": "Seorang pengguna sudah masuk. Mohon perbarui halaman untuk melanjutkan."
    },
    "problem": {
      "401_2": "Alamat email dan/atau kata sandi salah."
    }
  },
  "it": {
    "alert": {
      "alreadyLoggedIn": "Un utente ha già effettuato l'accesso. Aggiorna la pagina per continuare.",
      "changePassword": "Per proteggere il tuo account, assicurati che la password sia lunga almeno 10 caratteri."
    },
    "oidc": {
      "body": "Fare clic su Continua per passare alla pagina di Login.",
      "error": {
        "auth-ok-user-not-found": "Al suo indirizzo e-mail non è associato alcun account su Central. Chiedete all'amministratore di Central di creare un account per continuare.",
        "email-not-verified": "Il vostro indirizzo e-mail non è stato verificato dal server di accesso. Contattare l'amministratore del server.",
        "email-claim-not-provided": "Central non è riuscito ad accedere all'indirizzo e-mail associato al vostro account. Ciò potrebbe essere dovuto al fatto che l'amministratore del server ha configurato qualcosa di errato o non ha impostato un indirizzo e-mail per l'account. Potrebbe anche essere il risultato delle opzioni di privacy che si possono scegliere durante il processo di login. In tal caso, riprovare e assicurarsi che il proprio indirizzo e-mail sia condiviso.",
        "internal-server-error": "Qualcosa è andato storto durante l'accesso. Contattare l'amministratore del server."
      }
    },
    "problem": {
      "401_2": "Indirizzo e-mail e/o password errati."
    }
  },
  "ja": {
    "alert": {
      "alreadyLoggedIn": "すでにユーザーでログインされています。 続けるにはページを更新してください。"
    },
    "problem": {
      "401_2": "メールアドレスとパスワードの一方、または両方が違います。"
    }
  },
  "pt": {
    "alert": {
      "alreadyLoggedIn": "O usuário encontrasse logado atualmente. Por favor atualize a página para continuar.",
      "changePassword": "Para proteger a sua conta, certifique-se que sua senha tem 10 caracteres ou mais."
    },
    "oidc": {
      "body": "Clique em Continuar para prosseguir para a página de login.",
      "error": {
        "auth-ok-user-not-found": "Não há nenhuma conta no Central associada ao seu endereço de e-mail. Peça ao seu administrador do Central para criar uma conta para você continuar.",
        "email-not-verified": "Seu endereço de e-mail não foi verificado pelo seu servidor de login. Por favor, entre em contato com o administrador do seu servidor.",
        "email-claim-not-provided": "O Central não conseguiu acessar o endereço de e-mail associado à sua conta. Isso pode ter ocorrido porque o administrador do servidor configurou algo incorretamente ou não definiu um endereço de e-mail para a sua conta. Também pode ser resultado de opções de privacidade que você pode escolher durante o processo de login. Nesse caso, tente novamente e certifique-se de que seu e-mail seja compartilhado.",
        "internal-server-error": "Algo deu errado durante o login. Por favor, entre em contato com o administrador do seu servidor."
      }
    },
    "problem": {
      "401_2": "Endereço de email e/ou senha incorretos."
    }
  },
  "sw": {
    "alert": {
      "alreadyLoggedIn": "Mtumiaji tayari ameingia. Tafadhali onyesha upya ukurasa ili kuendelea."
    },
    "oidc": {
      "body": "Bofya Endelea ili kuendelea na ukurasa wa kuingia.",
      "error": {
        "auth-ok-user-not-found": "Hakuna akaunti ya Kati inayohusishwa na anwani yako ya barua pepe. Tafadhali muulize msimamizi wako Mkuu akufungulie akaunti ili uendelee.",
        "email-not-verified": "Anwani yako ya barua pepe haijathibitishwa na seva yako ya kuingia. Tafadhali wasiliana na msimamizi wa seva yako.",
        "email-claim-not-provided": "Central haikuweza kufikia anwani ya barua pepe inayohusishwa na akaunti yako. Hii inaweza kuwa kwa sababu msimamizi wa seva yako amesanidi kitu vibaya, au hajaweka anwani ya barua pepe kwa akaunti yako. Inaweza pia kuwa matokeo ya chaguzi za faragha ambazo unaweza kuchagua wakati wa mchakato wa kuingia. Ikiwa ndivyo, tafadhali jaribu tena na uhakikishe kuwa barua pepe yako inashirikiwa.",
        "internal-server-error": "Hitilafu fulani imetokea wakati wa kuingia. Tafadhali wasiliana na msimamizi wa seva yako."
      }
    },
    "problem": {
      "401_2": "Anwani ya barua pepe na/au nenosiri si sahihi."
    }
  },
  "zh": {
    "alert": {
      "alreadyLoggedIn": "已有用户登录，请刷新页面继续。",
      "changePassword": "为保护您的账户安全，请确保密码长度不少于10个字符。"
    },
    "oidc": {
      "body": "点击“继续”前往登录页面。",
      "error": {
        "auth-ok-user-not-found": "您的邮箱地址没有关联的Central账户。请联系Central管理员为您创建账户以继续操作。",
        "email-not-verified": "您的邮箱地址尚未通过登录服务器验证。请联系系统管理员。",
        "email-claim-not-provided": "Central无法访问您账户关联的邮箱地址。这可能是因为服务器管理员配置有误，或未为您的账户设置邮箱地址。也可能是您在登录过程中选择了隐私选项所致。如是后者，请重试并确保已勾选共享邮箱信息。",
        "internal-server-error": "登录过程中出现错误，请联系服务器管理员。"
      }
    },
    "problem": {
      "401_2": "邮箱地址和/或密码不正确。"
    }
  },
  "zh-Hant": {
    "alert": {
      "alreadyLoggedIn": "使用者已登入，重新載入頁面再繼續進行。",
      "changePassword": "為了保護您的帳戶，請確保您的密碼為 10 個字元以上。"
    },
    "oidc": {
      "body": "點選繼續進入登入頁面。",
      "error": {
        "auth-ok-user-not-found": "沒有與您的電子郵件地址關聯的 Central 帳戶。請要求您的 Central 管理員建立帳戶以便您繼續登入。",
        "email-not-verified": "您的登入伺服器尚未驗證您的電子郵件地址。請聯絡您的伺服器管理員。",
        "email-claim-not-provided": "Central 無法存取與您的帳戶關聯的電子郵件地址。這可能是因為您的伺服器管理員配置不正確，或沒有為您的帳戶設定電子郵件地址。這也可能是您在登入過程中可以選擇的隱私選項的結果。如果是這樣，請重試並確保您的電子郵件已分享。",
        "internal-server-error": "登入期間出現問題。請聯絡您的伺服器管理員。"
      }
    },
    "problem": {
      "401_2": "電子郵件地址和/或密碼不正確。"
    }
  }
}
</i18n>
