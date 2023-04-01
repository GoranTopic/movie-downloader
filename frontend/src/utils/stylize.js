import styled from 'styled-components';

// this seem awfully like magic, 
// but it basicacilly running a componenet thorgh styled function 
// and  passing the components
const stylize = (Component, css) => styled(props => <Component {...props} />)(css)

export default stylize;