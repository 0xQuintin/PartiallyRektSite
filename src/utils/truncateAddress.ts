export const truncateAddress = async (_address:string) => {
    let add0 = _address;
    let add1 = add0.slice(0, 6);
    let add2 = add0.slice(36, 40);
    let add3 = add1 + "..." + add2;

    return add3;
}

export default truncateAddress;