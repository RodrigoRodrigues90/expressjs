const getFirstName = (nomeCompleto) => {
 
  const partesDoNome = nomeCompleto.trim().split(' ');

  return partesDoNome[0];
}
module.exports = getFirstName;
