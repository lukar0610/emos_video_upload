import { computed, ref } from 'vue'
import { useLocalStorage } from '@vueuse/core'
import { defineStore } from 'pinia'

export const useSignStore = defineStore('sign', () => {
  const username = useLocalStorage<string | null>('emos_username', null)
  const authorizationHeader = useLocalStorage<string | null>('emos_authorization', null)
  const authEnabled = ref(true)
  const authenticated = ref(false)
  const fileStorages = ref<string[]>([])

  const isSignedIn = computed(() => !authEnabled.value || authenticated.value)

  function setSession(nextUsername: string, authorization: string) {
    username.value = nextUsername.trim()
    authorizationHeader.value = authorization
  }

  function setAuthState(enabled: boolean, isAuthenticated: boolean) {
    authEnabled.value = enabled
    authenticated.value = isAuthenticated
  }

  function setFileStorages(nextFileStorages: string[]) {
    fileStorages.value = [...nextFileStorages]
  }

  function signOut() {
    username.value = null
    authorizationHeader.value = null
    authenticated.value = false
  }

  function authorization() {
    return authorizationHeader.value ?? ''
  }

  return {
    username,
    authorizationHeader,
    authEnabled,
    authenticated,
    fileStorages,
    isSignedIn,
    setSession,
    setAuthState,
    setFileStorages,
    signOut,
    authorization,
  }
})

export default useSignStore
