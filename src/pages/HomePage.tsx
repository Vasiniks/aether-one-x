import { Film } from '../film/Film'
import { BuyDeck } from '../film/BuyDeck'

/** The product film: one continuous shot, then the closing configurator deck. */
export function HomePage() {
  return (
    <>
      <Film />
      <BuyDeck />
    </>
  )
}