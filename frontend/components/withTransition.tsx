import { motion } from 'framer-motion';
import { FC } from 'react'

const withTransition = (Component: FC<any>) => {
  const result = (props: any) => (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3, ease: 'easeInOut' }}
    // animate={{ width: '100%' }}
    // exit={{ transition: { duration: 1 } }}

    >
      <Component {...props} />
    </motion.div>
  );
  result.displayName = Component.displayName
  return result
}

export default withTransition