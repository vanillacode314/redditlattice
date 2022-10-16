import { Component } from 'solid-js'
import styles from '@ui/Spinner.module.css'

export const Spinner: Component = () => {
  return (
    <div class={styles['lds-ring']}>
      <div></div>
      <div></div>
      <div></div>
      <div></div>
    </div>
  )
}

export default Spinner
