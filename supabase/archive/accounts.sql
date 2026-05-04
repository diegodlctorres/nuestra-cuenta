-- ====== ACCOUNTS (Cuentas) ======
CREATE POLICY "Members can view household accounts" ON accounts
  FOR SELECT USING (EXISTS (SELECT 1 FROM household_members WHERE household_id = accounts.household_id AND profile_id = auth.uid()));

CREATE POLICY "Members can insert household accounts" ON accounts
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM household_members WHERE household_id = accounts.household_id AND profile_id = auth.uid()));

CREATE POLICY "Members can update household accounts" ON accounts
  FOR UPDATE USING (EXISTS (SELECT 1 FROM household_members WHERE household_id = accounts.household_id AND profile_id = auth.uid()));

CREATE POLICY "Members can delete household accounts" ON accounts
  FOR DELETE USING (EXISTS (SELECT 1 FROM household_members WHERE household_id = accounts.household_id AND profile_id = auth.uid()));


-- ====== CATEGORIES (Categorías) ======
CREATE POLICY "Members can view household categories" ON categories
  FOR SELECT USING (EXISTS (SELECT 1 FROM household_members WHERE household_id = categories.household_id AND profile_id = auth.uid()));

CREATE POLICY "Members can insert household categories" ON categories
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM household_members WHERE household_id = categories.household_id AND profile_id = auth.uid()));

CREATE POLICY "Members can delete household categories" ON categories
  FOR DELETE USING (EXISTS (SELECT 1 FROM household_members WHERE household_id = categories.household_id AND profile_id = auth.uid()));


-- ====== TRANSACTIONS (Transacciones) ======
CREATE POLICY "Members can view household transactions" ON transactions
  FOR SELECT USING (EXISTS (SELECT 1 FROM household_members WHERE household_id = transactions.household_id AND profile_id = auth.uid()));

CREATE POLICY "Members can insert household transactions" ON transactions
  FOR INSERT WITH CHECK (EXISTS (SELECT 1 FROM household_members WHERE household_id = transactions.household_id AND profile_id = auth.uid()));

CREATE POLICY "Members can delete household transactions" ON transactions
  FOR DELETE USING (EXISTS (SELECT 1 FROM household_members WHERE household_id = transactions.household_id AND profile_id = auth.uid()));


-- ====== PETS (Mascotas) ======
CREATE POLICY "Members can manage household pets" ON pets
  FOR ALL USING (EXISTS (SELECT 1 FROM household_members WHERE household_id = pets.household_id AND profile_id = auth.uid()));
