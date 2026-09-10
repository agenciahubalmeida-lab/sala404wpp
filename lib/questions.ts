export const questions = [
  {
    title: "O QUE VOCÊ FAZ HOJE?",
    options: [
      "Tenho uma empresa",
      "Trabalho com tecnologia / desenvolvimento",
      "Trabalho com marketing ou vendas",
      "Presto serviços / consultoria",
      "Sou profissional liberal",
      "Trabalho como funcionário em uma empresa",
      "Sou estudante",
      "Outro",
    ],
  },
  {
    title: "VOCÊ JÁ VENDEU ALGUMA COISA PELA INTERNET?",
    options: [
      "Sim, serviços",
      "Sim, produtos físicos",
      "Sim, cursos / conhecimento",
      "Sim, software / SaaS",
      "Sim, outra coisa",
      "Nunca vendi nada pela internet",
    ],
  },
  {
    title: "NO SEU MELHOR MÊS, QUANTO VOCÊ JÁ VENDEU PELA INTERNET?",
    options: [
      "Ainda não vendi",
      "Até R$5.000",
      "R$5.000 a R$15.000",
      "R$15.000 a R$50.000",
      "R$50.000 a R$100.000",
      "Mais de R$100.000",
      "Prefiro não informar",
    ],
  },
  {
    title: "O QUE TE TROUXE ATÉ A SALA 404?",
    options: [
      "Quero descobrir como ganhar dinheiro com IA",
      "Quero criar meu primeiro SaaS",
      "Quero vender software para empresas",
      "Quero usar IA para produzir mais sozinho",
      "Já vendo pela internet e quero conhecer novos modelos",
      "Só quero acompanhar os bastidores",
    ],
  },
];
export function maskPhone(value: string) {
  const n = value.replace(/\D/g, "").slice(0, 11);
  return n.length > 7
    ? `(${n.slice(0, 2)}) ${n.slice(2, 7)}-${n.slice(7)}`
    : n.length > 2
      ? `(${n.slice(0, 2)}) ${n.slice(2)}`
      : n;
}
