# Validação do projeto

O LeadFlow possui três níveis de validação recomendados:

1. **Backend**: `mvn clean test` e `mvn package`.
2. **Frontend**: `npm run typecheck` e `npm run build`.
3. **Integração**: `docker compose up --build`, seguido de smoke tests nos perfis Administrador, Gerente e Vendedor.

O script `scripts/verify.sh` executa as verificações locais disponíveis em sequência.

## Smoke test funcional

Validar no mínimo:

- autenticação e refresh de sessão;
- cadastro de empresa;
- isolamento entre perfis e filiais;
- criação, edição, pesquisa e paginação de Leads;
- mudança de etapa pelo Funil e alternativa por seletor;
- reatribuição de responsável sem alterar a filial;
- registro de interação e aplicação de pontuação;
- criação, edição, conclusão e atraso de tarefas;
- Dashboard, Filiais, Ranking e filtros de período;
- criação/desativação de usuários e regras de pontuação;
- notificações e configurações;
- layouts em 1440, 1280, 1024, 768 e 390 px.

## Observação

Nenhum projeto de software pode ser considerado livre de defeitos apenas por inspeção estática. Antes de produção, execute a suíte completa no ambiente de destino, com PostgreSQL e as dependências efetivamente resolvidas, e realize testes de integração, segurança e acessibilidade.


## Validações executadas durante a geração

Foram executadas verificações estáticas no pacote entregue:

- parsing/sintaxe TypeScript com `tsc --noCheck`;
- parsing Java com `javac -proc:none` para identificar erros sintáticos independentes das bibliotecas externas;
- validação de `pom.xml`, JSON e YAML;
- conferência de imports relativos do frontend;
- conferência de imports internos `br.com.leadflow.*`;
- verificação arquitetural para impedir import direto de DAO pelos Controllers;
- revisão de escopo de vendedor para não carregar filtros/diretórios administrativos;
- revisão de desativação de usuário com dependências;
- conferência das 14 rotas do produto e das migrations Flyway.

O build completo com resolução real de dependências continua sendo obrigatório no ambiente de destino. O ambiente usado para gerar este pacote não disponibilizou Maven/Docker nem os pacotes React pelo registry configurado, portanto não seria correto declarar que os testes de integração foram executados aqui. Use `./scripts/verify.sh` em um ambiente com acesso às dependências antes do deploy.
