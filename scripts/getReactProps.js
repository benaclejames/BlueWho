// Lots of this is referenced from https://gist.github.com/busybox11/53c76f57a577a47a19fab649a76f18e3
// Much 💙 @chaoticvibing/busybox11

// STOLEN FROM https://stackoverflow.com/questions/70507318/how-to-get-react-element-props-from-html-element-with-javascript
function getReactProps(parent, target) {
    // INITIAL VERY WIP FIREFOX HANDLING

    parent = (window.chrome) ? parent : parent.wrappedJSObject;
    target = (window.chrome) ? target : target.wrappedJSObject;

    const keyof_ReactProps = Object.keys(parent).find(k => k.startsWith("__reactProps$"));
    const symof_ReactFragment = Symbol.for("react.fragment");

    //Find the path from target to parent
    let path = [];
    let elem = target;
    while (elem !== parent) {
        let index = 0;
        for (let sibling = elem; sibling != null;) {
            if (sibling[keyof_ReactProps]) index++;
            sibling = sibling.previousElementSibling;
        }
        path.push({child: elem, index});
        elem = elem.parentElement;
    }
    //Walk down the path to find the react state props
    let state = elem[keyof_ReactProps];
    for (let i = path.length - 1; i >= 0 && state != null; i--) {
        //Find the target child state index
        let childStateIndex = 0, childElemIndex = 0;
        while (childStateIndex < state.children.length) {
            let childState = state.children[childStateIndex];
            if (childState instanceof Object) {
                //Fragment children are inlined in the parent DOM element
                let isFragment = childState.type === symof_ReactFragment && childState.props.children.length;
                childElemIndex += isFragment ? childState.props.children.length : 1;
                if (childElemIndex === path[i].index) break;
            }
            childStateIndex++;
        }
        let childState = state.children[childStateIndex] ?? (childStateIndex === 0 ? state.children : null);
        state = childState?.props;
        elem = path[i].child;
    }
    return state;
}

// This path is used to find any instance of the verified icon
let regularVerifiedPath = 'svg path[d^="M22.25 12c0-1.43-.88-2.67-2.19-3.34.46-1.39.2-2.9-.81-3.91s-2.52-1.27-3.91-.81c-.66-1.31-1.91-2.19-3.34-2.19s-2.67.88-3.33 2.19c-1.4-.46-2.91-.2-3.92.81s-1.26 2.52-.8 3.91c-1.31.67-2.2 1.91-2.2 3.34s.89 2.67 2.2 3.34c-.46 1.39-.21 2.9.8 3.91s2.52 1.26 3.91.81c.67 1.31 1.91 2.19 3.34 2.19s2.68-.88 3.34-2.19c1.39.45 2.9.2 3.91-.81s1.27-2.52.81-3.91c1.31-.67 2.19-1.91 2.19-3.34zm-11.71 4.2L6.8 12.46l1.41-1.42 2.26 2.26 4.8-5.23 1.47 1.36-6.2 6.77z"]'

function ScrapeIconsFromMutation(mutation) {
    for (let node of mutation.addedNodes) {
        let ticks;
        try {
            // Try look for any elements that have the verified icon
            ticks = node.querySelectorAll(regularVerifiedPath);
        } catch (e) {
            // If it's not an element, it's not a node we care about
            continue;
        }

        for (let tick of ticks) {
            let tickRoot = tick.parentElement.parentElement;
            let props = getReactProps(tickRoot.parentElement, tickRoot);
            if (!props)
                continue;

            if (props.accessibilityLabel === "Verified account")
            {
                tickRoot = tickRoot.parentElement.parentElement;
                props = getReactProps(tickRoot.parentElement, tickRoot);
            }

            let isBlue = props.children[0][0].props.isBlueVerified;
            if (isBlue) // If it's blue, delete the element
                tickRoot.remove();
        }
    }
}

// Create an observer instance.
const observer = new MutationObserver(function (mutations) {
        for (let mutation of mutations) {
            try {
            ScrapeIconsFromMutation(mutation);
            } catch (e) {
                // Do nothing
            }
        }
});

console.log("Registering event listener");

observer.observe(document, {
    childList: true,
    subtree: true
});

