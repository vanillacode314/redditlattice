import styles from '@ui/Spinner.module.css'
import { Component } from 'solid-js'

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
